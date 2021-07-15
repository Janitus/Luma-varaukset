Feature: As an employee I want to create a new event

Scenario: A new event is succesfully created by an employee with valid information
    Given Employee is logged in
    And I navigate to the create event page
    When valid information is entered
    Then an event is succesfully created and success toast is shown

Scenario: A new event is not created by an employee if title is missing
    Given Employee is logged in
    And I navigate to the create event page
    When too short a title is entered
    Then no event is created and an error toast is shown