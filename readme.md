# Contact Management Service

This service manages user contact information by linking multiple email and phone combinations to a single user identity. It provides a `/identify` endpoint that consolidates and retrieves associated contact information.

## Features

- Create new primary and secondary contact entries.
- Link multiple email and phone numbers.
- Seamlessly transform primary contacts into secondary when new data overlaps.
- Error handling with meaningful responses.

## Prerequisites

- Node.js
- MongoDB

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd contact-management-service
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Usage

### POST `/identify`

#### Request Body

```json
{
  "email": "user@example.com",
  "phone": "1234567890",
  "product": "Product Name"
}
```

#### Response Example

```json
{
  "primaryContactId": "60f7b2c5e3b1a9cde0e6b77d",
  "contactPairs": [
    { "email": "user@example.com", "phone": "1234567890" }
  ],
  "secondaryContactIds": ["60f7b2c5e3b1a9cde0e6b77e"],
  "createdAt": "2025-01-07T10:30:00Z",
  "updatedAt": "2025-01-07T10:30:00Z",
  "deletedAt": null
}
```

## Deployment

The application is deployed at: [Deployment Link](deployment-url)

## Running Tests

1. Run unit tests:
   ```bash
   npm test
   ```