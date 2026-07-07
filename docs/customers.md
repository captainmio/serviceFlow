# Customers

## Current Scope
- Customer management screen for authenticated users
- Admins and managers can create, edit, delete, and mark customers active or inactive
- All authenticated users can view, search, and filter customers
- Deleting a customer is blocked when related jobs or invoices exist

## Data Model
- `customers` stores `company_name`, `contact_person`, `email`, `phone`, `address`, `status`, `created_at`, `updated_at`
- `jobs` and `invoices` include `customer_id`, `created_at`, and `updated_at`
- `users` already includes `created_at` and `updated_at`

## API
- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:customerId`
- `DELETE /api/customers/:customerId`

## Search And Filter
- Search matches company name, contact person, email, and phone
- Status filter supports `active` and `inactive`

## Delete Rule
- If a customer has related jobs or invoices, the API returns a conflict error
- Users should set the customer to `inactive` instead of deleting
