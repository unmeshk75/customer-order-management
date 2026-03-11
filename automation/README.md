
To run the tests inside automation folder,
```bash
npx playwright test e2e/tests
```


What each test covers
File	Tests
tc_man_01.spec.js	Country→State dropdown: initial disabled state, US triggers dropdown, 50 states
tc_man_02.spec.js	Country→State: US→NY confirm, switch Canada hides dropdown, XPath label assertion
tc_man_03.spec.js	Order wizard: step navigation, product selection, customer required validation
tc_man_04.spec.js	Order filters: status/priority filter checkboxes + API negative test
tc_man_05.spec.js	Dashboard stats: customer/order/revenue counts match API data