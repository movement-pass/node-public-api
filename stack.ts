import { App, Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { Table } from '@aws-cdk/aws-dynamodb';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import {
  CorsHttpMethod,
  DomainName,
  HttpApi,
  PayloadFormatVersion
} from '@aws-cdk/aws-apigatewayv2';
import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ApiGatewayv2DomainProperties } from '@aws-cdk/aws-route53-targets';

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
      runtime: Runtime.NODEJS_14_X,
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
    }

    const integration = new LambdaProxyIntegration({
      handler: lambda,
      payloadFormatVersion: PayloadFormatVersion.VERSION_2_0
    });

    const api = new HttpApi(this, 'Api', {
      apiName: name,
      defaultIntegration: integration,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: Duration.days(365)
      },
      disableExecuteApiEndpoint: true,
      createDefaultStage: false
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

    const domainName = new DomainName(this, 'Domain', {
      domainName: `${subDomain}.${rootDomain}`,
      certificate
    });

    api.addStage('Stage', {
      stageName: version,
      autoDeploy: true,
      domainMapping: { domainName, mappingKey: version }
    });

    const zone = HostedZone.fromLookup(this, 'Zone', {
      domainName: rootDomain
    });

    new ARecord(this, 'Mount', {
      recordName: subDomain,
      target: RecordTarget.fromAlias(
        new ApiGatewayv2DomainProperties(
          domainName.regionalDomainName,
          domainName.regionalHostedZoneId
        )
      ),
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
