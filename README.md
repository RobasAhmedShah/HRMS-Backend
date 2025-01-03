# HRMS Backend API Documentation

This document serves as the official guide for the Human Resource Management System (HRMS) backend APIs. These APIs manage employees and provide features such as adding, editing, deleting, retrieving, and searching employee data. The backend is built using Firebase, Firestore, and Node.js.

---

## Base URL
All API requests are served over HTTPS.

```

```

---

## API Endpoints

### 1. Add Employee


**Description:** Adds a new employee to the system.

**Request URL:**
```
https://addemployee-gasng5ql5q-uc.a.run.app
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 30,
  "department": "Engineering"
}
```

**Response:**
- **201 Created**
  ```json
  {
    "message": "Employee added successfully",
    "id": "generatedEmployeeId"
  }
  ```
- **400 Bad Request**: Invalid or missing fields.
- **500 Internal Server Error**: Server error.

---

### 2. Edit Employee


**Description:** Edits an existing employee.

**Request URL:**
```
https://editemployee-gasng5ql5q-uc.a.run.app
```

**Query Parameters:**
- `id`: Employee ID (required)

**Request Body:**
```json
{
  "name": "John Smith",
  "department": "Sales"
}
```

**Response:**
- **200 OK**
  ```json
  {
    "message": "Employee updated successfully"
  }
  ```
- **400 Bad Request**: Missing `id` or invalid fields.
- **404 Not Found**: Employee not found.
- **500 Internal Server Error**: Server error.

---

### 3. Delete Employee


**Description:** Deletes an employee by ID.

**Request URL:**
```
https://deleteemployee-gasng5ql5q-uc.a.run.app
```

**Query Parameters:**
- `id`: Employee ID (required)

**Response:**
- **200 OK**
  ```json
  {
    "message": "Employee deleted successfully"
  }
  ```
- **400 Bad Request**: Missing `id`.
- **404 Not Found**: Employee not found.
- **500 Internal Server Error**: Server error.

---

### 4. Get All Employees


**Description:** Retrieves all employees.

**Request URL:**
```
https://getallemployees-gasng5ql5q-uc.a.run.app
```

**Response:**
- **200 OK**
  ```json
  [
    {
      "id": "employeeId1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 30,
      "department": "Engineering",
      "createdAt": "timestamp"
    },
    {
      "id": "employeeId2",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "age": 28,
      "department": "HR",
      "createdAt": "timestamp"
    }
  ]
  ```
- **404 Not Found**: No employees found.
- **500 Internal Server Error**: Server error.

---

### 5. Search Employees


**Description:** Searches for employees based on any field and value.

**Request URL:**
```
https://searchemployees-gasng5ql5q-uc.a.run.app
```

**Query Parameters:**
- `field`: The field to search by (e.g., `name`, `email`, `department`) (required)
- `value`: The value to match (required)

**Response:**
- **200 OK**
  ```json
  [
    {
      "id": "employeeId1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 30,
      "department": "Engineering",
      "createdAt": "timestamp"
    }
  ]
  ```
- **404 Not Found**: No matching employees found.
- **400 Bad Request**: Missing `field` or `value`.
- **500 Internal Server Error**: Server error.

---

## Error Codes
- **400 Bad Request**: The request is invalid or missing required fields.
- **404 Not Found**: The requested resource does not exist.
- **500 Internal Server Error**: A server-side error occurred.

---

## Notes
1. All requests that send a body must use the `Content-Type: application/json` header.
2. For any issues or questions, please contact the backend team.

---

## Changelog
### v1.0.0
- Initial release of HRMS Backend APIs.

---

## Authors
- Backend Team
