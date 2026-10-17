import assert from 'node:assert/strict';
import test from 'node:test';

import {
  employerFormFromProfile,
  getFirstIncompleteTab,
  getEmployerStepErrors,
  getFirstStepWithErrors,
  getNextEmployerTab,
  getPreviousEmployerTab,
  EMPLOYER_PROFILE_TAB_LABELS,
  groupMissingByTab,
  isEmployerProfileTab,
  employerFormToUpdate,
  getRequiredBusinessDocuments,
  validateEmployerProfile,
  validateExperience,
  findDuplicateExperience,
  validateFreelancerProfile,
} from './profile-form.ts';

test('validates freelancer profile fields against backend constraints', () => {
  assert.equal(validateFreelancerProfile({ bio: 'too short', hourlyRate: 0, availability: 'available' }), 'Bio must be at least 10 characters.');
  assert.equal(validateFreelancerProfile({ bio: 'A sufficiently detailed bio', hourlyRate: 0, availability: 'available' }), 'Hourly rate must be at least 1.');
  assert.equal(validateFreelancerProfile({ bio: 'A sufficiently detailed bio', hourlyRate: 25, availability: 'available' }), null);
});

const validEmployer = {
  companyName: 'Acme',
  description: 'A detailed company description',
  industry: 'Tech',
  businessType: 'sole_proprietorship',
  tin: '123-456-789',
  registrationNumber: 'DTI-12345',
  businessAddress: '1 Ayala Ave, Makati City',
  businessPhone: '+63 912 345 6789',
  businessEmail: 'hello@acme.ph',
  website: '',
  yearEstablished: '2015',
};

test('validates employer profile fields against backend constraints', () => {
  assert.equal(validateEmployerProfile({ ...validEmployer, companyName: 'X' }), 'Company name must be at least 2 characters.');
  assert.equal(validateEmployerProfile({ ...validEmployer, description: 'short' }), 'Company description must be at least 10 characters.');
  assert.equal(validateEmployerProfile(validEmployer), null);
});

test('requires every business field except the website', () => {
  assert.equal(validateEmployerProfile({ ...validEmployer, businessType: '' }), 'Select your business type.');
  assert.equal(validateEmployerProfile({ ...validEmployer, tin: '12345' }), 'TIN must look like 123-456-789 or 123-456-789-000.');
  assert.equal(validateEmployerProfile({ ...validEmployer, registrationNumber: '' }), 'Enter your DTI registration number.');
  assert.equal(validateEmployerProfile({ ...validEmployer, registrationNumber: 'ab' }), 'DTI registration number must be 3 to 50 characters.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessType: 'corporation', registrationNumber: '' }), 'Enter your SEC registration number.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessAddress: '' }), 'Enter your business address.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessAddress: 'abc' }), 'Business address must be 5 to 500 characters.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessPhone: 'call me' }), 'Enter a valid phone number, e.g. +63 912 345 6789.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessEmail: 'nope' }), 'Enter a valid email address, e.g. name@company.com.');
  assert.equal(validateEmployerProfile({ ...validEmployer, website: 'acme.ph' }), 'Website must start with http:// or https://.');
  assert.equal(validateEmployerProfile({ ...validEmployer, website: 'https://acme.ph' }), null);
  assert.equal(validateEmployerProfile({ ...validEmployer, yearEstablished: '' }), 'Enter the year your business was established, e.g. 2015.');
});

test('requires DTI for sole proprietorships and SEC otherwise', () => {
  assert.deepEqual(getRequiredBusinessDocuments('sole_proprietorship'), ['bir_2303', 'dti_certificate', 'mayors_permit']);
  assert.deepEqual(getRequiredBusinessDocuments('corporation'), ['bir_2303', 'sec_registration', 'mayors_permit']);
});

test('converts between the employer profile and the form', () => {
  const update = employerFormToUpdate({ ...validEmployer, tin: ' 123-456-789 ' });
  assert.equal(update.tin, '123-456-789');
  assert.equal(update.yearEstablished, 2015);
  assert.equal(update.website, '');
  const form = employerFormFromProfile({ companyName: 'Acme', description: 'd', industry: 'i', businessType: null, tin: null, registrationNumber: null, businessAddress: null, businessPhone: null, businessEmail: null, website: null, yearEstablished: null });
  assert.equal(form.businessType, '');
  assert.equal(form.yearEstablished, '');
});

test('requires coherent experience dates and backend minimum lengths', () => {
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '', endDate: null }), 'Start date is required.');
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '2026-01-01', endDate: '2025-01-01' }), 'End date cannot be before start date.');
  assert.equal(validateExperience({ title: 'Engineer', company: 'Acme', description: 'Built accessible products', startDate: '2025-01-01', endDate: null }), null);
});

test('finds a work history entry with the same position, company and dates', () => {
  const entries = [
    { id: 'e1', title: 'Nuclear Engineer', company: 'Meralco', startDate: '2026-06-03T00:00:00.000Z', endDate: '2026-10-22' },
    { id: 'e2', title: 'Radiation Officer', company: 'Meralco', startDate: '2026-06-03', endDate: null },
  ];
  const form = { title: ' nuclear  engineer ', company: 'MERALCO', description: 'Different text', startDate: '2026-06-03', endDate: '2026-10-22', skills: [] };
  assert.equal(findDuplicateExperience(form, entries, null)?.id, 'e1');
  // Saving the entry being edited is not a duplicate of itself.
  assert.equal(findDuplicateExperience(form, entries, 'e1'), undefined);
  // Different dates make it a separate stint.
  assert.equal(findDuplicateExperience({ ...form, endDate: null }, entries, null), undefined);
});

test('groups missing business items by employer profile tab', () => {
  const groups = groupMissingByTab({ missingFields: ['tin', 'yearEstablished', 'businessEmail'], missingDocuments: ['mayors_permit'] });
  assert.deepEqual(groups.company, ['Year established']);
  assert.deepEqual(groups.business, ['TIN', 'Business email']);
  assert.deepEqual(groups.documents, ["Mayor's / Business Permit"]);
});

test('picks the first employer profile tab that still has gaps', () => {
  assert.equal(getFirstIncompleteTab({ missingFields: ['tin'], missingDocuments: ['bir_2303'] }), 'business');
  assert.equal(getFirstIncompleteTab({ missingFields: ['industry', 'tin'], missingDocuments: [] }), 'company');
  assert.equal(getFirstIncompleteTab({ missingFields: [], missingDocuments: ['bir_2303'] }), 'documents');
  assert.equal(getFirstIncompleteTab({ missingFields: [], missingDocuments: [] }), 'company');
  assert.equal(isEmployerProfileTab('documents'), true);
  assert.equal(isEmployerProfileTab('billing'), false);
  assert.equal(isEmployerProfileTab(null), false);
});

test('steps through the employer setup in tab order', () => {
  assert.equal(getNextEmployerTab('company'), 'business');
  assert.equal(getNextEmployerTab('business'), 'documents');
  assert.equal(getNextEmployerTab('documents'), null);
  assert.equal(getPreviousEmployerTab('company'), null);
  assert.equal(getPreviousEmployerTab('business'), 'company');
  assert.equal(getPreviousEmployerTab('documents'), 'business');
  assert.equal(EMPLOYER_PROFILE_TAB_LABELS.business, 'Business details');
});

test('checks each setup step on its own', () => {
  const blank = { ...validEmployer, companyName: '', tin: '', businessEmail: 'nope' };
  assert.deepEqual(Object.keys(getEmployerStepErrors(blank, 'company')), ['companyName']);
  assert.deepEqual(Object.keys(getEmployerStepErrors(blank, 'business')), ['tin', 'businessEmail']);
  assert.deepEqual(getEmployerStepErrors(blank, 'documents'), {});
  assert.deepEqual(getEmployerStepErrors(validEmployer, 'company'), {});
  // The optional website is only checked when filled in.
  assert.deepEqual(Object.keys(getEmployerStepErrors({ ...validEmployer, website: 'acme.ph' }, 'company')), ['website']);
});

test('finds the first step that still has problems', () => {
  assert.equal(getFirstStepWithErrors({ tin: 'x' }), 'business');
  assert.equal(getFirstStepWithErrors({ tin: 'x', industry: 'y' }), 'company');
  assert.equal(getFirstStepWithErrors({}), null);
});

test('says what to enter for empty fields and what is wrong for invalid ones', () => {
  const thisYear = new Date().getFullYear();
  assert.equal(validateEmployerProfile({ ...validEmployer, companyName: '' }), 'Enter your company name.');
  assert.equal(validateEmployerProfile({ ...validEmployer, industry: ' ' }), 'Enter your industry, e.g. Construction or Retail.');
  assert.equal(validateEmployerProfile({ ...validEmployer, industry: 'X' }), 'Industry must be at least 2 characters.');
  assert.equal(validateEmployerProfile({ ...validEmployer, description: '' }), 'Add a short description of your company.');
  assert.equal(validateEmployerProfile({ ...validEmployer, yearEstablished: '15' }), 'Enter the year as 4 digits, e.g. 2015.');
  assert.equal(validateEmployerProfile({ ...validEmployer, yearEstablished: String(thisYear + 1) }), `Year established can't be later than ${thisYear}.`);
  assert.equal(validateEmployerProfile({ ...validEmployer, yearEstablished: '1700' }), "Year established can't be earlier than 1800.");
  assert.equal(validateEmployerProfile({ ...validEmployer, tin: '' }), 'Enter your TIN, e.g. 123-456-789-000.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessPhone: '' }), 'Enter your business phone number.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessEmail: '' }), 'Enter your business email.');
  assert.equal(validateEmployerProfile({ ...validEmployer, businessType: '', registrationNumber: '' }), 'Select your business type.');
  assert.equal(
    getEmployerStepErrors({ ...validEmployer, businessType: '', registrationNumber: '' }, 'business').registrationNumber,
    'Enter your DTI or SEC registration number.',
  );
});
