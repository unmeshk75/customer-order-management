import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC_CUST_01-TC02: Non-US country keeps State as disabled input', () => {

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const customersPage = new CustomerPage(page);
    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    await customersPage.loc.countryInput.fill('Canada');
    await customersPage.loc.countryInput.blur();

    await expect(customersPage.loc.stateSelect).not.toBeVisible();

    await expect(customersPage.loc.stateInput).toBeVisible();
    await expect(customersPage.loc.stateInput).toBeDisabled();

    await customersPage.cancelForm();
  });

});
