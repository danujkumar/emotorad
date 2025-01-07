const request = require('supertest');
const app = require('../index'); 
const User = require('../src/models/user'); 

jest.mock('../src/models/user');

describe('Identify API', () => {
  it('should create a new primary contact if no matching contact exists', async () => {
    User.findOne.mockResolvedValueOnce(null);  // Simulate no matching contact
    User.create.mockResolvedValueOnce({ _id: '123', email: 'test@example.com', phone: '1234567890', linkPrecedence: 'primary' });

    const response = await request(app)
      .post('/identify')
      .send({ email: 'test@example.com', phone: '1234567890', product: 'gadget' });

    expect(response.status).toBe(201);
    expect(response.body.primaryContactId).toBe('123');
  });

  it('should link a new secondary contact if a matching primary contact exists', async () => {
    User.findOne.mockResolvedValueOnce({ _id: '456', linkPrecedence: 'primary', secondaryContacts: [] });
    User.create.mockResolvedValueOnce({ _id: '789', email: 'new@example.com', phone: '9876543210', linkPrecedence: 'secondary' });

    const response = await request(app)
      .post('/identify')
      .send({ email: 'new@example.com', phone: '9876543210', product: 'widget' });

    expect(response.status).toBe(200);
    expect(response.body.primaryContactId).toBe('456');
    expect(response.body.secondaryContactIds).toContain('789');
  });
});
