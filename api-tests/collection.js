import getPets from './requests/get-pets.js';
import getPetOwners from './requests/get-pet-owners.js';

export const name = 'ModernRestApi';

export function preRequest() {
  pm.variables.set('baseUrl', 'http://localhost:5001');
}

export const order = [
  getPets,
  getPetOwners
];
