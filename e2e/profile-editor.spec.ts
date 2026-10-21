import { expect, test, type Page } from '@playwright/test';

const timestamps = {
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
};

function taxonomyCategory(id: string, name: string, skills: string[]) {
  return {
    id,
    name,
    description: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    skills: skills.map((skill) => ({ id: `${id}-${skill}`, categoryId: id, name: skill, description: '', isActive: true, createdAt: '', updatedAt: '' })),
  };
}

const skillTaxonomy = {
  categories: [
    taxonomyCategory('category-frontend', 'Frontend', ['React', 'Vue']),
    taxonomyCategory('category-mobile', 'Mobile', ['Flutter', 'Swift']),
    taxonomyCategory('category-soft', 'Soft Skills', ['Communication']),
  ],
};

// Every required business field is filled in, so the employer form can be saved.
const businessFields = {
  businessType: 'corporation',
  tin: '123-456-789-000',
  registrationNumber: 'CS201912345',
  businessAddress: '1 Ayala Ave, Makati City',
  businessPhone: '+63 2 8123 4567',
  businessEmail: 'hello@acme.ph',
  website: null,
  yearEstablished: 2015,
};

// What the employer form sends for the profile above, apart from the edited fields.
const businessUpdate = {
  businessType: 'corporation',
  tin: '123-456-789-000',
  registrationNumber: 'CS201912345',
  businessAddress: '1 Ayala Ave, Makati City',
  businessPhone: '+63 2 8123 4567',
  businessEmail: 'hello@acme.ph',
  website: '',
  yearEstablished: 2015,
};

async function mockEmployerCompleteness(page: Page) {
  await page.route('**/api/employers/profile/completeness', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ complete: true, missingFields: [], missingDocuments: [] }),
  }));
}

async function authenticate(page: Page, user: Record<string, unknown>) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user }),
  }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

test('employer edits the company profile through the supported profile endpoint', async ({ page }) => {
  const user = { id: 'employer-1', email: 'owner@example.com', name: 'Owner', role: 'employer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-1', userId: user.id, name: 'Owner', nationality: 'PH', companyName: 'Acme Labs', description: 'We build reliable digital products.', industry: 'Technology', ...businessFields, ...timestamps };
  let updateBody: unknown;
  await authenticate(page, user);
  await mockEmployerCompleteness(page);
  await page.route('**/api/employers/profile', async (route) => {
    if (route.request().method() === 'PATCH') {
      updateBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...profile, ...(updateBody as object) }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
  });

  await page.goto('/dashboard/employer/profile');
  await expect(page.getByLabel('Verified name')).toHaveValue('Owner');
  await expect(page.getByLabel('Nationality')).toHaveValue('PH');
  await page.getByLabel('Company name').fill('Acme Studio');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
  expect(updateBody).toEqual({
    companyName: 'Acme Studio',
    description: profile.description,
    industry: profile.industry,
    ...businessUpdate,
  });
});

test('freelancer checks a catalog skill in the categorized skill picker', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [], availability: 'available', ...timestamps };
  let skillBody: unknown;
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/skills', async (route) => {
    skillBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...profile, skills: [{ name: 'React', yearsOfExperience: 0, addedManually: true }] }),
    });
  });
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, createdAt: '', updatedAt: '', skills: [{ id: 'skill-react', categoryId: 'category-1', name: 'React', description: '', isActive: true, createdAt: '', updatedAt: '' }] }] }),
  }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  let removedSkill: string | undefined;
  await page.route('**/api/freelancers/profile/skills/*', async (route) => {
    removedSkill = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1) ?? '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
  });

  await page.goto('/dashboard/freelancer/profile');
  await expect(page.getByLabel('Nationality')).toHaveValue('PH');
  await expect(page.getByText('No skills yet. Add them here or through your work history.')).toBeVisible();
  // The catalog stays closed until the freelancer asks for it.
  await expect(page.getByRole('button', { name: 'React', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add skills' }).click();
  await page.getByRole('button', { name: 'React', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Technical skills', exact: true })).toContainText('React');
  await expect(page.getByRole('button', { name: 'React', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(skillBody).toEqual({ skills: [{ name: 'React', yearsOfExperience: 0 }] });
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'React', exact: true })).toHaveCount(0);

  // A skill picked by hand can be removed straight from the summary.
  await page.getByRole('list', { name: 'Technical skills', exact: true }).getByRole('button', { name: 'Remove React' }).click();
  await expect(page.getByText('No skills yet. Add them here or through your work history.')).toBeVisible();
  expect(removedSkill).toBe('React');
});

test('freelancer profile tolerates legacy and nameless skill entries from the API', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = {
    id: 'profile-2',
    userId: user.id,
    name: 'Developer',
    nationality: 'PH',
    bio: 'I build accessible web applications.',
    hourlyRate: 30,
    skills: [
      { skill_name: 'React', years_of_experience: 3 },
      { yearsOfExperience: 8 },
    ],
    experience: [],
    availability: 'available',
    ...timestamps,
  };
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ categories: [{ id: 'category-1', name: 'Development', description: '', isActive: true, createdAt: '', updatedAt: '', skills: [{ id: 'skill-react', categoryId: 'category-1', name: 'React', description: '', isActive: true, createdAt: '', updatedAt: '' }] }] }),
  }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');

  const technicalSkills = page.getByRole('list', { name: 'Technical skills', exact: true });
  await expect(technicalSkills).toContainText('React');
  await expect(technicalSkills).toContainText('3y');
  await expect(page.getByText('No skills yet.', { exact: false })).not.toBeVisible();
  await page.getByRole('button', { name: 'Add skills' }).click();
  await expect(page.getByRole('button', { name: 'React', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('freelancer profile renders legacy experiences with unique React keys', async ({ page }) => {
  test.setTimeout(60_000);
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = {
    id: 'profile-2',
    userId: user.id,
    name: 'Developer',
    nationality: 'PH',
    bio: 'I build accessible web applications.',
    hourlyRate: 30,
    skills: [],
    experience: [
      { id: 'experience-1', title: 'Engineer', company: 'Current Co', description: 'Current contract', startDate: '2024-01-01', endDate: null },
      { id: 'experience-1', title: 'Developer', company: 'Duplicate Co', description: 'Duplicate persisted id', start_date: '2022-01-01', end_date: '2023-12-31' },
      { experience_id: 'experience-3', title: 'Consultant', company: 'Legacy Co', description: 'Legacy identifier', start_date: '2020-01-01', end_date: null },
      { title: 'Intern', company: 'Old Co', description: 'Missing persisted id', startDate: '2019-01-01', endDate: '2019-12-31' },
    ],
    availability: 'available',
    ...timestamps,
  };
  const keyWarnings: string[] = [];
  let removedExperienceId: string | undefined;
  page.on('console', (message) => {
    if (message.text().includes('Each child in a list should have a unique')) {
      keyWarnings.push(message.text());
    }
  });
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/experience/*', (route) => {
    removedExperienceId = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1) ?? '');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...profile, experience: profile.experience.slice(0, -1) }),
    });
  });
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');

  await expect(page.getByText('Engineer', { exact: true })).toBeVisible();
  await expect(page.locator('#dashboard-content').getByText('Developer', { exact: true })).toBeVisible();
  await expect(page.getByText('Consultant', { exact: true })).toBeVisible();
  await expect(page.getByText('Intern', { exact: true })).toBeVisible();
  expect(keyWarnings).toEqual([]);

  await page.getByRole('button', { name: 'Delete Intern' }).click();
  await expect(page.getByText('Work history removed.')).toBeVisible();
  expect(removedExperienceId).toBe('legacy-experience-3');
});

test('freelancer suggests a new skill for administrator review', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [], availability: 'available', ...timestamps };
  let suggestionBody: unknown;
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: [] }) }));
  await page.route('**/api/skills/suggestions', async (route) => {
    if (route.request().method() === 'POST') {
      suggestionBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Skill suggestion submitted for administrator review.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/dashboard/freelancer/profile');
  await page.getByRole('button', { name: "Can't find your skill? Suggest it" }).click();
  await page.locator('#suggest-skill-name').fill('Prompt engineering');
  await page.locator('#suggest-skill-description').fill('Designs and evaluates reliable language-model prompts.');
  await page.getByRole('button', { name: 'Submit suggestion' }).click();

  await expect(page.getByText('Skill suggestion sent to administrators for review.')).toBeVisible();
  expect(suggestionBody).toEqual({ name: 'Prompt engineering', description: 'Designs and evaluates reliable language-model prompts.' });
});

test('employer sees an in-app unsaved-changes bar and can revert it', async ({ page }) => {
  const user = { id: 'employer-1', email: 'owner@example.com', name: 'Owner', role: 'employer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-1', userId: user.id, name: 'Owner', nationality: 'PH', companyName: 'Acme Labs', description: 'We build reliable digital products.', industry: 'Technology', ...businessFields, ...timestamps };
  await authenticate(page, user);
  await mockEmployerCompleteness(page);
  await page.route('**/api/employers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));

  await page.goto('/dashboard/employer/profile');

  // A freshly loaded profile is not dirty, so nothing is pending yet.
  await expect(page.getByLabel('Company name')).toHaveValue('Acme Labs');
  await expect(page.getByText('You have unsaved changes')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeDisabled();

  await page.getByLabel('Company name').fill('Acme Studio');
  await expect(page.getByText('You have unsaved changes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeEnabled();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('Company name')).toHaveValue('Acme Labs');
  await expect(page.getByText('You have unsaved changes')).not.toBeVisible();
});

test('leaving the profile with pending edits opens the app dialog, not a browser prompt', async ({ page }) => {
  const user = { id: 'employer-1', email: 'owner@example.com', name: 'Owner', role: 'employer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-1', userId: user.id, name: 'Owner', nationality: 'PH', companyName: 'Acme Labs', description: 'We build reliable digital products.', industry: 'Technology', ...businessFields, ...timestamps };
  const nativeDialogs: string[] = [];
  let updateBody: unknown;
  page.on('dialog', (dialog) => {
    nativeDialogs.push(dialog.message());
    return dialog.dismiss();
  });
  await authenticate(page, user);
  await mockEmployerCompleteness(page);
  await page.route('**/api/employers/profile', async (route) => {
    if (route.request().method() === 'PATCH') {
      updateBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...profile, ...(updateBody as object) }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
  });

  await page.goto('/dashboard/employer/profile');
  await page.getByLabel('Company name').fill('Acme Studio');

  await page.getByRole('link', { name: 'My projects' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Leave without saving?');
  expect(nativeDialogs).toEqual([]);
  expect(page.url()).toContain('/dashboard/employer/profile');

  // Keeping the edits leaves the person exactly where they were.
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByLabel('Company name')).toHaveValue('Acme Studio');

  await page.getByRole('link', { name: 'My projects' }).first().click();
  await page.getByRole('button', { name: 'Save and leave' }).click();
  await expect(page).toHaveURL(/\/dashboard\/employer\/projects$/);
  expect(updateBody).toEqual({ companyName: 'Acme Studio', description: profile.description, industry: profile.industry, ...businessUpdate });
});

test('adding work history with skills saves immediately and leaves nothing pending', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [], availability: 'available', ...timestamps };
  const addedExperience = { id: 'experience-1', title: 'Mobile Developer', company: 'Acme Labs', description: 'Built the payments app.', startDate: '2023-01-01', endDate: null, skills: ['Communication'] };
  const nativeDialogs: string[] = [];
  let experienceBody: unknown;
  page.on('dialog', (dialog) => {
    nativeDialogs.push(dialog.message());
    return dialog.dismiss();
  });
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/experience', async (route) => {
    experienceBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...profile,
        experience: [addedExperience],
        skills: [{ name: 'Communication', yearsOfExperience: 3, addedManually: false }],
      }),
    });
  });
  await page.route('**/api/skills', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(skillTaxonomy),
  }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');
  await page.getByRole('button', { name: 'Add work history' }).first().click();
  await page.getByLabel('Job position', { exact: true }).fill(addedExperience.title);
  await page.getByLabel('Company').fill(addedExperience.company);
  await page.locator('#experience-start').fill(addedExperience.startDate);
  await page.locator('#experience-description').fill(addedExperience.description);
  const form = page.locator('form:has(#experience-title)');
  await form.getByRole('tab', { name: /Soft skills/ }).click();
  await form.getByRole('button', { name: 'Communication', exact: true }).click();
  await expect(form.getByRole('tab', { name: /Soft skills/ })).toContainText('1');
  await page.getByRole('button', { name: 'Add work history', exact: true }).last().click();

  await expect(page.getByText('Work history added.')).toBeVisible();
  expect(experienceBody).toEqual({ title: addedExperience.title, company: addedExperience.company, description: addedExperience.description, startDate: addedExperience.startDate, endDate: null, skills: ['Communication'] });
  // Skills from work history show up in the Skills section on their own,
  // grouped as soft skills, and are removed through the entry, not here.
  const softSkills = page.getByRole('list', { name: 'Soft skills', exact: true });
  await expect(softSkills).toContainText('Communication');
  await expect(softSkills).toContainText('3y');
  await expect(softSkills.getByText('(from your work history)')).toBeAttached();
  await expect(softSkills.getByRole('button', { name: 'Remove Communication' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Technical skills', exact: true })).toHaveCount(0);

  // The profile fields were untouched, so no save is outstanding and nothing
  // blocks navigation.
  await expect(page.getByText('You have unsaved changes')).not.toBeVisible();
  await page.getByRole('link', { name: 'My proposals' }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/freelancer\/proposals$/);
  expect(nativeDialogs).toEqual([]);
});

test('job position detects its skill categories and can be corrected', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const profile = {
    id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], availability: 'available', ...timestamps,
    experience: [{ id: 'experience-1', title: 'Senior Web Developer', company: 'TechCorp', description: 'Full-stack development.', startDate: '2023-01-01', endDate: null, skills: ['React'] }],
  };
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(skillTaxonomy) }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');
  await page.getByRole('button', { name: 'Add work history' }).first().click();
  const form = page.locator('form:has(#experience-title)');
  const position = form.getByLabel('Job position', { exact: true });
  await expect(form.getByText('Type your job position to narrow these skills.')).toBeVisible();

  // A detected title narrows the technical skills to its category.
  await position.fill('Senior iOS Engineer');
  await expect(form.getByText('Showing skills for:')).toBeVisible();
  await expect(form.getByRole('button', { name: 'Flutter', exact: true })).toBeVisible();
  await expect(form.getByRole('button', { name: 'React', exact: true })).toHaveCount(0);
  await form.getByRole('button', { name: 'Flutter', exact: true }).click();

  // Removing the detected category shows everything again.
  await form.getByRole('button', { name: 'Stop showing Mobile skills' }).click();
  await expect(form.getByText('No match for your job position — showing all technical skills.')).toBeVisible();
  await expect(form.getByRole('button', { name: 'React', exact: true })).toBeVisible();

  // A category can be added by hand.
  await form.getByLabel('Add a skill category').selectOption({ label: 'Frontend' });
  await expect(form.getByRole('button', { name: 'React', exact: true })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Swift', exact: true })).toHaveCount(0);
  // A pick from a category that is no longer shown stays visible and removable.
  await expect(form.getByRole('list', { name: 'Also picked' })).toContainText('Flutter');

  // Changing the title never drops skills that are already ticked.
  await position.fill('Software Engineer II');
  await expect(form.getByRole('list', { name: 'Also picked' })).toContainText('Flutter');
  await form.getByRole('list', { name: 'Also picked' }).getByRole('button', { name: 'Remove Flutter' }).click();
  await expect(form.getByRole('list', { name: 'Also picked' })).toHaveCount(0);
  await expect(form.getByRole('tab', { name: /Technical skills/ })).toContainText('0');

  // Editing keeps the saved title as typed and detects from it.
  await page.getByRole('button', { name: 'Edit Senior Web Developer' }).click();
  await expect(position).toHaveValue('Senior Web Developer');
  await expect(form.getByRole('button', { name: 'Stop showing Frontend skills' })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Flutter', exact: true })).toHaveCount(0);
});

test('work history cannot be saved twice and shows its skills by type', async ({ page }) => {
  const user = { id: 'freelancer-1', email: 'dev@example.com', name: 'Developer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', ...timestamps };
  const existing = { id: 'experience-1', title: 'Nuclear Engineer', company: 'Meralco', description: 'Reactor safety work.', startDate: '2026-06-03', endDate: '2026-10-22', skills: ['Swift', 'Communication'] };
  const profile = { id: 'profile-2', userId: user.id, name: 'Developer', nationality: 'PH', bio: 'I build accessible web applications.', hourlyRate: 30, skills: [], experience: [existing], availability: 'available', ...timestamps };
  let posts = 0;
  await authenticate(page, user);
  await page.route('**/api/freelancers/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }));
  await page.route('**/api/freelancers/profile/experience', async (route) => {
    posts += 1;
    await new Promise((resolve) => setTimeout(resolve, 400));
    const added = { ...route.request().postDataJSON(), id: `experience-${posts + 1}` };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...profile, experience: [existing, added] }) });
  });
  await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(skillTaxonomy) }));
  await page.route('**/api/skills/custom', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto('/dashboard/freelancer/profile');
  await expect(page.getByRole('list', { name: 'Technical skills used as Nuclear Engineer' })).toContainText('Swift');
  await expect(page.getByRole('list', { name: 'Soft skills used as Nuclear Engineer' })).toContainText('Communication');

  const fillEntry = async (title: string) => {
    await page.getByRole('button', { name: 'Add work history' }).first().click();
    await page.getByLabel('Job position', { exact: true }).fill(title);
    await page.getByLabel('Company').fill('meralco');
    await page.locator('#experience-start').fill('2026-06-03');
    await page.locator('#experience-end').fill('2026-10-22');
    await page.locator('#experience-description').fill('Reactor safety work again.');
  };

  // An exact repeat of an existing entry is refused before anything is sent.
  await fillEntry('nuclear engineer');
  await page.getByRole('button', { name: 'Add work history', exact: true }).last().click();
  await expect(page.getByText('This work history entry is already on your profile.')).toBeVisible();
  expect(posts).toBe(0);

  // A double click on a new entry sends it once.
  await page.getByLabel('Job position', { exact: true }).fill('Radiation Officer');
  await page.getByRole('button', { name: 'Add work history', exact: true }).last().dblclick();
  await expect(page.getByText('Work history added.')).toBeVisible();
  expect(posts).toBe(1);
});
