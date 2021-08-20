interface IPass {
  id: string;
  fromLocation: string;
  toLocation: string;
  district: number;
  thana: number;
  startAt: Date;
  endAt: Date;
  type: string;
  reason: string;
  includeVehicle: boolean;
  vehicleNo?: string;
  selfDriven: boolean;
  driverName?: string;
  driverLicenseNo?: string;
  applicantId: string;
  status: string;
  createdAt: Date;
}

export { IPass };
