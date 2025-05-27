export class User {
  constructor(
    public email: string,
    public id: string,
    private _token: string,
    private _expirationDate: Date
  ) {}
}
