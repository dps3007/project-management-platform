class ApiResponse {
  constructor(statusCode = 200, data = null, message = "Success", ) {
    this.success = statusCode < 400;
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }
}

export default ApiResponse;
