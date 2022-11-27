import { Construct } from 'constructs';
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';

import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';

import { Code, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { Bucket } from 'aws-cdk-lib/aws-s3';

import { Stream } from 'aws-cdk-lib/aws-kinesis';

import {
  AwsIntegration,
  BasePathMapping,
  ConnectionType,
  DomainName,
  EndpointType,
  LambdaIntegration,
  MethodLoggingLevel,
  PassthroughBehavior,
  RestApi,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway';

import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';

import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';

class PublicApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const app = this.node.tryGetContext('app');
    const version = this.node.tryGetContext('version');

    const subDomain = `public-api`;
    const name = `${app}_${subDomain}_${version}`;
    const configRootKey = `/${app}/${version}`;

    const lambda = new Function(this, 'Lambda', {
      functionName: name,
      handler: 'index.handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: Duration.seconds(30),
      tracing: Tracing.ACTIVE,
      code: Code.fromAsset(`./dist`),
      environment: {
        NODE_ENV: 'production',
        CONFIG_ROOT_KEY: configRootKey
      }
    });

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParametersByPath'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${configRootKey}`
        ]
      })
    );

    for (const partialName of ['applicants', 'passes']) {
      const tableName = StringParameter.valueForStringParameter(
        this,
        `${configRootKey}/${partialName}Table`
      );

      const table = Table.fromTableArn(
        this,
        `${partialName}DynamoDBTable`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}`
      );

      table.grantReadWriteData(lambda);

      lambda.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['dynamodb:Query'],
          resources: [`${table.tableArn}/index/*`]
        })
      );
    }

    const photoBucketName = StringParameter.valueForStringParameter(
      this,
      `${configRootKey}/photoBucketName`
    );

    const photoBucket = Bucket.fromBucketName(
      this,
      'photoBucket',
      photoBucketName
    );

    photoBucket.grantPut(lambda);

    const stream = Stream.fromStreamArn(
      this,
      'Stream',
      `arn:aws:kinesis:${this.region}:${this.account}:stream/passes-load`
    );

    const role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });

    stream.grantWrite(role);

    const lambdaIntegration = new LambdaIntegration(lambda, {
      proxy: true
    });

    const api = new RestApi(this, 'Api', {
      restApiName: name,
      minimumCompressionSize: 1024,
      endpointTypes: [EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: Duration.days(365)
      },
      deployOptions: {
        metricsEnabled: true,
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.ERROR,
        stageName: version
      },
      cloudWatchRole: true,
      defaultIntegration: lambdaIntegration
    });

    const proxyResource = api.root.addProxy({ anyMethod: false });

    proxyResource.addMethod('GET');
    proxyResource.addMethod('POST');

    const kinesisIntegration = new AwsIntegration({
      service: 'kinesis',
      action: 'PutRecord',
      integrationHttpMethod: 'POST',
      options: {
        passthroughBehavior: PassthroughBehavior.NEVER,
        connectionType: ConnectionType.INTERNET,
        credentialsRole: role,
        requestParameters: {
          'integration.request.header.Content-Type': "'application/json'"
        },
        requestTemplates: {
          'application/json': JSON.stringify({
            StreamName: stream.streamName,
            Data: '$util.base64Encode($input.body)',
            PartitionKey: '$context.requestId'
          })
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            responseTemplates: {
              'application/json': JSON.stringify({ success: true })
            },
            selectionPattern: '200'
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            responseTemplates: {
              'application/json': JSON.stringify({
                error: 'internal server error!'
              })
            },
            selectionPattern: '500'
          }
        ]
      }
    });

    const methodResponseParameters = {
      'method.response.header.Content-Type': true,
      'method.response.header.Access-Control-Allow-Origin': true
    };

    api.root.addResource('passes').addMethod('POST', kinesisIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: methodResponseParameters
        },
        {
          statusCode: '500',
          responseParameters: methodResponseParameters
        }
      ]
    });

    const rootDomain = this.node.tryGetContext('domain');

    const certificateArn = StringParameter.valueForStringParameter(
      this,
      `${configRootKey}/serverCertificateArn`
    );

    const certificate = Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

    const domainName = new DomainName(this, 'DomainName', {
      domainName: `${subDomain}.${rootDomain}`,
      endpointType: EndpointType.REGIONAL,
      securityPolicy: SecurityPolicy.TLS_1_2,
      certificate
    });

    new BasePathMapping(this, 'Mapping', {
      restApi: api,
      domainName,
      basePath: version
    });

    const domain = DomainName.fromDomainNameAttributes(this, 'Domain', {
      domainName: domainName.domainName,
      domainNameAliasHostedZoneId: domainName.domainNameAliasHostedZoneId,
      domainNameAliasTarget: domainName.domainNameAliasDomainName
    });

    const zone = HostedZone.fromLookup(this, 'Zone', {
      domainName: rootDomain
    });

    new ARecord(this, 'Mount', {
      recordName: subDomain,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(domain)),
      zone
    });
  }
}

const app = new App();

new PublicApiStack(app, 'PublicApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  stackName: `${app.node.tryGetContext(
    'app'
  )}-public-api-${app.node.tryGetContext('version')}`
});

app.synth();
