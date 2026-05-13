export default {
  method: 'GET',
  url: '{{baseUrl}}/api/pets'
};

export function postResponse() {
  pm.test('Status code is 200', () => pm.response.to.have.status(200));

  const json = pm.response.json();

  pm.test('Response is an array', () =>
    pm.expect(Array.isArray(json)).to.equal(true)
  );

  pm.test('Array contains at least one pet', () =>
    pm.expect(json.length).to.be.above(0)
  );

  pm.test('First pet has expected fields', () => {
    pm.expect(json[0]).to.have.property('id');
    pm.expect(json[0]).to.have.property('name');
    pm.expect(json[0]).to.have.property('species');
  });
}
