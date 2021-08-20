interface IApplicant {
  id: string;
  name: string;
  district: number;
  thana: number;
  dateOfBirth: Date;
  gender: string;
  idType: string;
  idNumber: string;
  photo: string;
  createdAt: Date;
  appliedCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export { IApplicant };
