

\# WEB POS — PHASE 00.5

\# LARAVEL API DISCOVERY & FRONTEND API CONTRACT

You are preparing the Next.js Web POS frontend for an existing Laravel SaaS/POS backend.

IMPORTANT:

The existing Laravel backend/API project is located at:

E:\\sv26\\htdocs\\post\_software

Database:

post\_software

DO NOT create a new Laravel project.

DO NOT move the Laravel project.

DO NOT recreate the Laravel backend.

DO NOT assume API endpoints.

DO NOT create fake/mock production APIs.

\==================================================

TASK

\==================================================

Before writing any Next.js business module, inspect the existing Laravel project:

E:\\sv26\\htdocs\\post\_software

Understand the existing backend and create a complete API discovery report for the Web POS.

\==================================================

INSPECT

\==================================================

Inspect at minimum:

routes/api.php

routes/web.php

app/Http/Controllers/

app/Http/Requests/

app/Http/Resources/

app/Models/

app/Services/

database/migrations/

database/seeders/

config/

.env structure where safe

composer.json

Also inspect authentication implementation.

\==================================================

AUTHENTICATION

\==================================================

Identify:

Authentication system

Login endpoint

Logout endpoint

Current-user endpoint

Password reset endpoints if available

Token/session mechanism

Authorization mechanism

Determine how the Next.js application should authenticate.

DO NOT expose secrets.

DO NOT print passwords, API secrets, encryption keys or credentials.

\==================================================

SAAS FOUNDATION

\==================================================

Identify existing APIs and models for:

Clients

Businesses

Branches

Users

Roles

Permissions

Packages

Features

Package Features

Subscriptions

Devices

Business Types

Settings

Activity Logs

Notifications

\==================================================

POS/BUSINESS APIs

\==================================================

Identify existing APIs for:

Products

Categories

Brands

Inventory

Stock Movements

Customers

Suppliers

Purchases

Purchase Items

Expenses

Sales

Sale Items

Payments

Returns

Receipts

Reports

Also identify:

Taxes

Discounts

Units

Cash Sessions

Payment Methods

if they already exist.

\==================================================

API ROUTE REPORT

\==================================================

Create a complete table:

Method

Endpoint

Authentication Required

Role/Permission

Business/Client Scope

Branch Scope

Request Parameters

Request Body

Response Structure

Pagination

Filters

Notes

Example:

GET

/api/v1/products

Authenticated

products.view

Business scoped

Branch scoped if applicable

DO NOT invent this example as an actual endpoint.

Use the actual endpoint discovered in the Laravel project.

\==================================================

CONTROLLERS

\==================================================

For each API, identify its controller.

Example:

ProductController

CustomerController

SaleController

Also identify:

Form Requests

API Resources

Services

Policies

Middleware

where applicable.

\==================================================

DATABASE

\==================================================

Inspect migrations and identify relationships.

For example:

Business

    ↓

Branch

    ↓

Products

and:

Sale

    ↓

Sale Items

    ↓

Products

Document actual relationships only.

Do not invent relationships.

\==================================================

MULTI-TENANCY

\==================================================

Determine how Laravel isolates:

Client

Business

Branch

User

Identify:

middleware

global scopes

policies

query filters

authorization

that protect tenant data.

This is critical.

\==================================================

ROLES & PERMISSIONS

\==================================================

Identify actual permissions.

Document which frontend sections should be visible for:

Owner

Admin

Manager

Cashier

Do not invent role names if different names already exist.

Use actual backend names.

\==================================================

SUBSCRIPTION

\==================================================

Identify:

Package

Subscription

Feature

Feature access

User limits

Branch limits

Device limits

and the API used to determine them.

\==================================================

DEVICE

\==================================================

Identify existing device APIs.

Document:

Register device

Validate device

Deactivate device

Device list

Device limit

if implemented.

\==================================================

API RESPONSE

\==================================================

Inspect actual JSON/API resources.

Document:

success format

error format

validation format

pagination format

Example only:

{

    "data": \[\],

    "meta": {}

}

Do not assume this structure.

Use actual Laravel response structures.

\==================================================

ERRORS

\==================================================

Document how Laravel returns:

401

403

404

409

422

429

500

if implemented.

\==================================================

MISSING APIs

\==================================================

Create a separate section:

MISSING / REQUIRED FOR WEB POS

List APIs required by the Web POS that do not currently exist.

For each missing API provide:

Feature

Required endpoint

Method

Purpose

Required request fields

Expected response

Backend dependencies

DO NOT implement missing APIs yet.

Only report them.

\==================================================

FRONTEND API CONTRACT

\==================================================

Create a proposed frontend service structure based ONLY on discovered APIs:

services/

    api-client

    auth

    dashboard

    products

    categories

    inventory

    customers

    suppliers

    purchases

    expenses

    sales

    reports

    settings

    subscription

    devices

Only create entries that are actually needed.

\==================================================

DESIGN SYSTEM

\==================================================

The Web POS brand colors are now FINAL:

Primary:

\#00BF63

White:

\#FFFFFF

Supporting:

\#000000

\#111111

\#171717

\#404040

\#737373

\#D4D4D4

\#E5E5E5

\#F5F5F5

Theme:

Light Mode

Dark Mode

Primary brand color must be \#00BF63.

Do NOT replace the brand color with blue, purple or another primary color.

Status colors may use appropriate:

Success

Warning

Error

Info

but they are NOT brand colors.

\==================================================

IMPORTANT

\==================================================

DO NOT:

Create fake API endpoints

Create mock production data

Modify Laravel architecture

Create a new Laravel project

Change database name

Change Laravel project location

Rewrite working backend code

\==================================================

DELIVERABLE

\==================================================

Create a detailed report:

1\. Laravel project structure

2\. Authentication architecture

3\. API routes

4\. Controllers

5\. Models

6\. Requests

7\. Resources

8\. Services

9\. Middleware

10\. Policies

11\. Roles

12\. Permissions

13\. SaaS APIs

14\. POS APIs

15\. Subscription APIs

16\. Device APIs

17\. API response formats

18\. Error formats

19\. Multi-tenant security

20\. Existing business modules

21\. Missing APIs required by Web POS

22\. Recommended frontend API service structure

Save the report as:

docs/LARAVEL\_API\_DISCOVERY.md

IMPORTANT:

After completing the discovery report, STOP.

Do not start designing the Dashboard.

Do not start Products.

Do not start POS.

Wait for the next instruction.

\# UNIVERSAL POS SAAS

\# WEB BROWSER MASTER DEVELOPMENT CONTEXT

You are developing the WEB BROWSER version of an existing Universal POS SaaS platform.

The Laravel backend already exists.

DO NOT rebuild the Laravel SaaS foundation.

The Laravel backend is the source of truth.

\==================================================

PROJECT

\==================================================

Product:

Universal POS SaaS

Database:

post\_software

Backend:

Laravel

PHP

MySQL

REST API

Web Frontend:

Next.js

React

TypeScript

Tailwind CSS

The web application must run inside a normal web browser.

It should also remain compatible with future PWA/mobile usage.

\==================================================

CRITICAL PRODUCT RULE

\==================================================

This is ONE POS APPLICATION.

Do NOT create a separate:

"Client Dashboard"

application.

The user should access ONE application containing:

Dashboard

POS

Products

Inventory

Customers

Suppliers

Purchases

Expenses

Reports

Employees

Branches

Settings

Subscription

The exact navigation depends on:

User Role

Business

Branch

Subscription

Enabled Features

\==================================================

EXISTING LARAVEL FOUNDATION

\==================================================

Laravel already contains the SaaS foundation.

Assume these concepts already exist:

Super Admin

Client

Business

Branch

User

Role

Permission

Package

Feature

Package Feature

Subscription

Device

Business Type

Settings

Activity Logs

Notifications

Do NOT recreate these in Next.js.

The frontend must consume them through Laravel APIs.

\==================================================

BUSINESS TYPES

\==================================================

The platform supports:

Grocery

Restaurant

Pharmacy

Electronics

Clothing

Salon

Hardware

Services

Wholesale

Other

The application must NOT be hard-coded for one industry.

\==================================================

FEATURE SYSTEM

\==================================================

The Laravel backend controls feature access.

Potential features:

POS

Inventory

Customers

Suppliers

Purchasing

Reports

Advanced Reports

Multi Branch

Custom Fields

Restaurant Module

Pharmacy Module

Electronics Module

Appointments

Frontend may hide unavailable features.

Frontend hiding is NOT security.

Laravel remains the final authorization layer.

\==================================================

ARCHITECTURE

\==================================================

Browser:

Next.js

↓

API service layer

↓

Laravel API

↓

MySQL

Do not put core business logic only inside React components.

\==================================================

API

\==================================================

Use:

/api/v1/

Do not create random API patterns.

Use a centralized API/service architecture.

Example:

services/

    auth

    dashboard

    products

    categories

    inventory

    customers

    suppliers

    purchases

    expenses

    sales

    reports

    settings

    subscriptions

Use typed request/response models where practical.

\==================================================

DESIGN SYSTEM

\==================================================

Brand colors:

BLACK

WHITE

NEUTRAL GRAYS

No blue/green/purple primary branding.

The product must look:

Premium

Modern

Minimal

Professional

Fast

Clean

Trustworthy

Avoid:

Excessive gradients

Excessive glassmorphism

Colorful dashboard templates

Old Bootstrap-style UI

Unnecessary animations

Over-rounded interfaces

\==================================================

THEME

\==================================================

Support:

LIGHT MODE

DARK MODE

Light:

white backgrounds

black text

neutral gray borders

white cards

Dark:

near-black backgrounds

white text

charcoal cards

subtle dark borders

Use semantic CSS variables/design tokens.

Do not hard-code colors throughout components.

\==================================================

TYPOGRAPHY

\==================================================

Use:

Inter

Use the same font everywhere.

Create consistent:

Heading

Body

Label

Caption

Button

Table

typography hierarchy.

\==================================================

ICONS

\==================================================

Use one consistent icon library.

Do not mix different icon styles.

\==================================================

DESIGN TOKENS

\==================================================

Create reusable tokens for:

Colors

Spacing

Radius

Typography

Shadows

Borders

Transitions

All future components must use the design system.

\==================================================

CORE COMPONENTS

\==================================================

Create reusable components:

Button

IconButton

Input

Textarea

Select

Checkbox

Switch

Card

Badge

Modal

Drawer

Dropdown

Tabs

Tooltip

Toast

Alert

DataTable

Pagination

Search

Filter

DatePicker

ConfirmDialog

EmptyState

LoadingState

Skeleton

Breadcrumb

Avatar

Do not duplicate UI unnecessarily.

\==================================================

LAYOUT

\==================================================

Desktop:

Sidebar

Topbar

Main content

Tablet:

Collapsible sidebar

Mobile:

Drawer navigation

Bottom navigation where useful

The browser app must remain fully responsive.

\==================================================

APPLICATION NAVIGATION

\==================================================

Main navigation may include:

Dashboard

POS

Products

Inventory

Customers

Purchasing

    Purchases

    Suppliers

Expenses

Reports

Business

    Employees

    Branches

Settings

Subscription

Navigation must be generated according to permissions/features where appropriate.

\==================================================

DASHBOARD

\==================================================

Dashboard is a section inside the POS application.

It is NOT a separate product.

Dashboard should show real business information.

Examples:

Today's Sales

Today's Orders

Low Stock

Customers

Expenses

Profit

Recent Sales

Top Products

Never use fake production statistics.

\==================================================

POS

\==================================================

POS is the primary transaction area.

It must be optimized for:

Speed

Product search

Barcode

Cart

Discount

Tax

Customer

Payment

Receipt

\==================================================

PRODUCT

\==================================================

Products must support core fields:

Name

SKU

Barcode

Category

Brand

Purchase Price

Sale Price

Tax

Unit

Stock

Minimum Stock

Status

Image

Architecture must be ready for:

Variants

Serial Numbers

Batch

Expiry

Warranty

Custom Fields

Do not force industry-specific fields on every business.

\==================================================

INVENTORY

\==================================================

Inventory should support:

Current stock

Stock value

Low stock

Out of stock

Stock movements

Adjustments

Backend remains responsible for stock calculations.

\==================================================

CUSTOMERS

\==================================================

Customer management:

Create

Edit

View

Search

Filter

Customer data may include:

Name

Phone

Email

Address

Notes

\==================================================

SUPPLIERS

\==================================================

Supplier management:

Create

Edit

View

Search

Filter

\==================================================

PURCHASES

\==================================================

Purchase management must support:

Supplier

Products

Quantity

Purchase price

Discount

Tax

Total

Status

Do not duplicate backend calculation rules.

\==================================================

EXPENSES

\==================================================

Support:

Expense

Category

Amount

Date

Notes

\==================================================

SALES

\==================================================

Sales records must support:

Invoice

Customer

Items

Quantity

Price

Discount

Tax

Total

Payment

Cashier

Branch

Date

\==================================================

RETURNS

\==================================================

Returns must NOT delete original sales.

Create proper return transactions.

\==================================================

REPORTS

\==================================================

Reports must use real backend data.

Examples:

Sales

Purchases

Expenses

Inventory

Products

Customers

Profit

Support date filtering.

\==================================================

USERS

\==================================================

Roles may include:

Client Owner

Business Admin

Manager

Cashier

Do not expose unauthorized functionality.

\==================================================

BRANCHES

\==================================================

If multi-branch is enabled:

Users can work with authorized branches.

Never allow unauthorized branch access.

\==================================================

SUBSCRIPTION

\==================================================

Show:

Package

Status

Start Date

Expiry

Usage

Features

Example:

Users 4/10

Branches 2/5

Devices 2/5

Backend enforces limits.

\==================================================

AUTHENTICATION

\==================================================

Use Laravel authentication/API.

Protect all private routes.

Unauthenticated users go to login.

Handle:

401

403

419

422

429

500

properly.

\==================================================

SECURITY

\==================================================

Never trust:

client\_id

business\_id

branch\_id

user\_id

from frontend requests.

Laravel must authorize access.

Do not expose:

API secrets

private credentials

internal database information

\==================================================

ERROR HANDLING

\==================================================

Never display raw technical errors.

Show user-friendly messages.

\==================================================

PERFORMANCE

\==================================================

Use:

Pagination

Lazy loading

Caching where appropriate

Debounced search

Optimized API requests

Optimized rendering

Do not fetch huge datasets unnecessarily.

\==================================================

MOBILE

\==================================================

Mobile browser must remain usable.

Do not simply shrink desktop.

Create proper mobile layouts.

Use touch-friendly controls.

\==================================================

FUTURE ELECTRON

\==================================================

The exact same UX/design system will later be used by:

Electron \+ React Desktop POS.

Do not put browser-only business logic into components that will make future Electron reuse difficult.

\==================================================

OFFLINE

\==================================================

Do NOT implement full offline SQLite in the browser during this phase.

Offline-first transactional POS belongs to the Electron version.

Browser should remain cloud/API driven.

\==================================================

IMPORTANT DEVELOPMENT RULE

\==================================================

Before coding:

1\. Inspect existing project.

2\. Inspect Laravel API.

3\. Inspect available endpoints.

4\. Inspect authentication.

5\. Inspect models/API responses.

6\. Reuse existing code.

7\. Do not invent backend structures.

8\. If an API is missing, document it and implement only required backend changes.

\==================================================

NO FAKE DATA

\==================================================

Do not create fake production data.

Seed/test data must be clearly separated.

\==================================================

COMPLETION REPORT

\==================================================

After every phase report:

Files created

Files modified

Packages installed

Routes

API endpoints

Components

Pages

Authentication changes

Database/API changes

Tests

Known limitations

Next phase

DO NOT automatically start the next phase.

\==================================================

MASTER RULE

\==================================================

This is ONE UNIVERSAL POS PRODUCT.

Dashboard

POS

Products

Inventory

Customers

Suppliers

Purchases

Expenses

Reports

Settings

must feel like parts of ONE application.

Never allow UI, terminology, colors, business logic or architecture to drift.

\# WEB PHASE 01

\# NEXT.JS PROJECT FOUNDATION \+ DESIGN SYSTEM

Follow WEB\_POS\_MASTER\_CONTEXT.md exactly.

\==================================================

TASK

\==================================================

Inspect the existing Next.js project.

If the project does not exist, initialize a production-ready:

Next.js

React

TypeScript

Tailwind CSS

application.

Do not introduce unnecessary libraries.

\==================================================

DESIGN SYSTEM

\==================================================

Build the global design system first.

Create:

Colors

Typography

Spacing

Radius

Shadows

Borders

Transitions

Use:

Black

White

Neutral Gray

\==================================================

THEME

\==================================================

Implement:

Light Mode

Dark Mode

Theme must persist.

Create a theme switcher.

Use CSS variables/design tokens rather than hard-coded colors.

\==================================================

FONT

\==================================================

Use Inter.

Ensure it is loaded efficiently.

\==================================================

COMPONENT LIBRARY

\==================================================

Create reusable:

Button

IconButton

Input

Select

Textarea

Checkbox

Switch

Card

Badge

Modal

Drawer

Dropdown

Tabs

Tooltip

Toast

Alert

Table

Pagination

Search

Filter

EmptyState

LoadingState

Skeleton

ConfirmDialog

\==================================================

QUALITY

\==================================================

Components must support:

hover

focus

disabled

loading

error

where applicable.

\==================================================

RESPONSIVE

\==================================================

Test:

1440

1280

1024

768

480

390

No horizontal overflow.

\==================================================

DELIVERABLE

\==================================================

Create foundation only.

Do not build business modules yet.

Report all files created and modified.

\# WEB PHASE 02

\# AUTHENTICATION \+ APPLICATION SHELL

Follow WEB\_POS\_MASTER\_CONTEXT.md.

\==================================================

AUTH

\==================================================

Connect Next.js to existing Laravel authentication/API.

Build:

Login

Forgot Password

Reset Password

Logout

Handle authenticated sessions securely.

\==================================================

ROUTE PROTECTION

\==================================================

Private routes must require authentication.

Public:

/login

/forgot-password

/reset-password

Private:

/dashboard

/pos

/products

/inventory

/customers

/suppliers

/purchases

/expenses

/reports

/settings

\==================================================

USER CONTEXT

\==================================================

After login retrieve:

User

Role

Permissions

Client

Business

Branch

Subscription

Enabled Features

Store only what is necessary.

\==================================================

APP SHELL

\==================================================

Build:

Sidebar

Topbar

Main content

Sidebar:

Dashboard

POS

Products

Inventory

Customers

Purchases

Suppliers

Expenses

Reports

Employees

Branches

Settings

Subscription

Navigation must respect permissions/features.

\==================================================

MOBILE

\==================================================

Desktop:

Sidebar

Mobile:

Drawer

Bottom navigation may contain:

Home

POS

Products

More

\==================================================

PROFILE

\==================================================

Profile dropdown:

Profile

Account

Theme

Logout

\==================================================

DELIVERABLE

\==================================================

Complete authentication and shell.

Do not build detailed business pages yet.

\# WEB PHASE 03

\# BUSINESS DASHBOARD

Follow WEB\_POS\_MASTER\_CONTEXT.md.

Build Dashboard inside the main application.

\==================================================

DASHBOARD

\==================================================

Create:

Today's Sales

Today's Orders

Low Stock

Customers

Expenses

Profit

\==================================================

SALES OVERVIEW

\==================================================

Create date-based sales overview.

Support:

Today

Yesterday

7 Days

30 Days

Custom Range

\==================================================

RECENT SALES

\==================================================

Show:

Invoice

Customer

Amount

Payment

Cashier

Date

Status

\==================================================

TOP PRODUCTS

\==================================================

Show:

Product

Units Sold

Revenue

\==================================================

LOW STOCK

\==================================================

Show:

Product

Current Stock

Minimum Stock

\==================================================

EMPTY STATES

\==================================================

If business has no sales:

"No sales yet"

Do not show fake statistics.

\==================================================

RESPONSIVE

\==================================================

Cards stack properly on mobile.

Charts must remain readable.

\==================================================

API

\==================================================

Use real Laravel API data.

Do not calculate business-level financial metrics only in React.

\# WEB PHASE 04

\# PRODUCTS \+ CATEGORIES

Follow WEB\_POS\_MASTER\_CONTEXT.md.

Build complete product management.

\==================================================

PRODUCT LIST

\==================================================

Columns:

Product

SKU

Barcode

Category

Price

Stock

Status

Actions

Support:

Search

Category filter

Status filter

Pagination

\==================================================

PRODUCT FORM

\==================================================

Fields:

Name

SKU

Barcode

Category

Brand

Purchase Price

Sale Price

Tax

Unit

Minimum Stock

Status

Image

Validate fields.

\==================================================

PRODUCT VIEW

\==================================================

Show:

Basic information

Pricing

Stock

Sales summary

Purchase summary

Activity where supported

\==================================================

CATEGORIES

\==================================================

Build:

List

Create

Edit

Delete

If backend supports hierarchy, support parent categories.

\==================================================

INDUSTRY READINESS

\==================================================

Prepare UI architecture for future:

Serial

IMEI

Batch

Expiry

Warranty

Variants

Custom Fields

Do not show these to every business by default.

\==================================================

DELIVERABLE

\==================================================

Complete CRUD connected to Laravel API.

\# WEB PHASE 05

\# INVENTORY MANAGEMENT

Follow WEB\_POS\_MASTER\_CONTEXT.md.

Build inventory management.

\==================================================

INVENTORY DASHBOARD

\==================================================

Show:

Total Products

Stock Value

Low Stock

Out of Stock

\==================================================

INVENTORY TABLE

\==================================================

Show:

Product

SKU

Branch

Stock

Minimum Stock

Status

\==================================================

STOCK MOVEMENTS

\==================================================

Show:

Product

Type

Quantity

Reference

User

Date

Types:

Purchase

Sale

Return

Adjustment

\==================================================

STOCK ADJUSTMENT

\==================================================

Authorized users can adjust stock.

Require:

Product

Branch

Quantity

Reason

Notes

Do not allow frontend to directly overwrite stock totals.

Create backend transaction/adjustment.

\==================================================

MULTI-BRANCH

\==================================================

If enabled:

Allow branch filtering.

Never expose unauthorized branches.

\==================================================

DELIVERABLE

\==================================================

Complete inventory UI \+ API integration.

\# WEB PHASE 06

\# CUSTOMERS \+ SUPPLIERS

Follow WEB\_POS\_MASTER\_CONTEXT.md.

\==================================================

CUSTOMERS

\==================================================

Build:

List

Create

Edit

View

Search

Filter

Fields:

Name

Phone

Email

Address

Notes

Customer profile should show:

Total Sales

Orders

Outstanding Balance if supported

Recent Transactions

\==================================================

SUPPLIERS

\==================================================

Build:

List

Create

Edit

View

Search

Filter

Fields:

Name

Phone

Email

Address

Notes

Supplier profile:

Purchases

Outstanding Balance if supported

Recent Purchases

\==================================================

UI

\==================================================

Use the same reusable tables/forms/components.

Mobile responsive.

\==================================================

DELIVERABLE

\==================================================

Complete CRUD and API integration.

\# WEB PHASE 07

\# PURCHASES \+ EXPENSES

Follow WEB\_POS\_MASTER\_CONTEXT.md.

\==================================================

PURCHASES

\==================================================

Build:

Purchase List

Create Purchase

View Purchase

Purchase form:

Supplier

Branch

Products

Quantity

Purchase Price

Discount

Tax

Total

Notes

Support adding/removing items.

\==================================================

TOTALS

\==================================================

Show:

Subtotal

Discount

Tax

Grand Total

Do not create conflicting frontend calculations.

Backend remains authoritative.

\==================================================

EXPENSES

\==================================================

Build:

Expense List

Create

Edit

Delete

View

Fields:

Title

Category

Amount

Date

Branch

Notes

\==================================================

FILTERS

\==================================================

Support:

Date

Branch

Supplier

Status

\==================================================

DELIVERABLE

\==================================================

Complete UI \+ API integration.

\# WEB PHASE 08

\# CORE POS SALES ENGINE

Follow WEB\_POS\_MASTER\_CONTEXT.md exactly.

Build the primary POS interface inside the same web application.

\==================================================

GOAL

\==================================================

The POS must be optimized for fast daily sales.

It should feel like a professional retail POS, not a normal dashboard page.

\==================================================

LAYOUT

\==================================================

Desktop:

Left:

Categories \+ Products

Center:

Product search/results

Right:

Cart

Top:

Branch

Cashier

Online status

Customer

Bottom:

Subtotal

Discount

Tax

Total

Payment

\==================================================

PRODUCT SEARCH

\==================================================

Search:

Product Name

SKU

Barcode

Support barcode scanner input.

Search must be fast.

Use debouncing where appropriate.

\==================================================

CATEGORIES

\==================================================

Show category buttons.

Selecting category filters products.

\==================================================

PRODUCT CARDS

\==================================================

Show:

Name

Price

Stock

Clicking adds product to cart.

\==================================================

CART

\==================================================

Support:

Add item

Remove item

Increase quantity

Decrease quantity

Edit quantity

Clear cart

Show:

Product

Quantity

Unit Price

Discount

Subtotal

\==================================================

CUSTOMER

\==================================================

Allow:

Walk-in Customer

Select Customer

Create Customer

\==================================================

DISCOUNT

\==================================================

Support authorized discount functionality.

Discount may be:

Fixed

Percentage

Respect backend permissions/settings.

\==================================================

TAX

\==================================================

Tax must follow backend/business configuration.

Do not hard-code tax rules.

\==================================================

CHECKOUT

\==================================================

Show:

Subtotal

Discount

Tax

Grand Total

Payment methods:

Cash

Card

Bank

Other

\==================================================

CASH

\==================================================

Show:

Total

Received

Change

Example:

Total: 50

Received: 100

Change: 50

\==================================================

SALE CREATION

\==================================================

When user confirms payment:

1\. Validate cart

2\. Send sale to Laravel

3\. Backend validates

4\. Backend creates sale

5\. Backend creates sale items

6\. Backend creates payment

7\. Backend updates inventory

8\. Return invoice/receipt information

9\. Clear cart

10\. Show success state

Do not trust frontend totals.

\==================================================

SUCCESS

\==================================================

After successful sale:

Show:

Sale completed

Invoice number

Total

Actions:

Print Receipt

New Sale

\==================================================

ERROR

\==================================================

If API fails:

Do not lose cart.

Keep cart intact.

Show friendly error.

\==================================================

KEYBOARD

\==================================================

Prepare shortcuts:

F2 Search

F4 Payment

Esc Close

Delete Remove selected

Do not break browser shortcuts.

\==================================================

MOBILE

\==================================================

On mobile:

Product area first

Cart accessible through prominent button/drawer

Payment must remain easy to access.

\==================================================

PERFORMANCE

\==================================================

Do not reload full product database on every search.

Use pagination/search API or optimized endpoint.

\==================================================

DELIVERABLE

\==================================================

Complete browser POS.

Do not implement offline SQLite yet.

\# WEB PHASE 09

\# SALES HISTORY \+ RETURNS \+ RECEIPTS

Follow WEB\_POS\_MASTER\_CONTEXT.md.

\==================================================

SALES HISTORY

\==================================================

Build:

Sales List

Sale Details

Filters:

Date

Cashier

Branch

Customer

Payment Method

Status

\==================================================

SALE DETAILS

\==================================================

Show:

Invoice

Customer

Cashier

Branch

Items

Subtotal

Discount

Tax

Total

Payment

Date

\==================================================

RECEIPT

\==================================================

Create reusable receipt layout.

Support:

58mm

80mm

A4

Receipt:

Business Logo

Business Name

Branch

Invoice

Date

Cashier

Items

Quantity

Price

Discount

Tax

Total

Payment

\==================================================

PRINT

\==================================================

Browser printing must work.

Use print-specific CSS.

Do not create a screenshot-style receipt.

\==================================================

RETURNS

\==================================================

Allow authorized users to return items.

Do not delete original sale.

Create proper return transaction.

Show:

Original Invoice

Product

Original Quantity

Returned Quantity

Reason

Refund Amount

\==================================================

DELIVERABLE

\==================================================

Complete sales history, receipt and return UI.

\# WEB PHASE 10

\# BUSINESS REPORTS

Follow WEB\_POS\_MASTER\_CONTEXT.md.

Build real reports using Laravel API data.

\==================================================

REPORTS

\==================================================

Create:

Sales Report

Purchases Report

Expenses Report

Inventory Report

Product Report

Customer Report

Profit Summary

\==================================================

FILTERS

\==================================================

Common:

Today

Yesterday

7 Days

30 Days

This Month

Last Month

Custom

Additional:

Branch

Cashier

Category

Payment Method

where supported.

\==================================================

SALES REPORT

\==================================================

Show:

Total Sales

Orders

Average Order Value

Discount

Tax

Net Sales

\==================================================

PURCHASE REPORT

\==================================================

Show:

Purchases

Total Cost

Supplier

\==================================================

EXPENSE REPORT

\==================================================

Show:

Total Expenses

By Category

\==================================================

INVENTORY REPORT

\==================================================

Show:

Stock

Stock Value

Low Stock

Out of Stock

\==================================================

UI

\==================================================

Use clean charts and tables.

Do not overload the interface.

Charts must have accessible labels.

\==================================================

EXPORT

\==================================================

If Laravel API supports export:

CSV

PDF

provide download actions.

Do not generate massive datasets in browser unnecessarily.

\==================================================

DELIVERABLE

\==================================================

Complete reports UI.

\# WEB PHASE 11

\# BUSINESS MANAGEMENT

Follow WEB\_POS\_MASTER\_CONTEXT.md.

\==================================================

EMPLOYEES

\==================================================

Build:

Employee List

Create

Edit

View

Activate

Deactivate

Roles:

Business Admin

Manager

Cashier

Respect package max\_users.

\==================================================

BRANCHES

\==================================================

Build:

Branch List

Create

Edit

View

Activate

Deactivate

Respect:

max\_branches

\==================================================

BUSINESS SETTINGS

\==================================================

Build:

Business Information

Logo

Phone

Email

Address

Currency

Timezone

Tax

Invoice Prefix

Receipt Settings

\==================================================

PROFILE

\==================================================

User:

Name

Email

Phone

Password

\==================================================

SUBSCRIPTION

\==================================================

Show:

Current Plan

Status

Start Date

Expiry

Features

Usage

Usage:

Users

Branches

Devices

\==================================================

FEATURES

\==================================================

Show enabled/disabled features.

Do not allow frontend to bypass Laravel feature restrictions.

\==================================================

THEME

\==================================================

Theme setting:

Light

Dark

\==================================================

DELIVERABLE

\==================================================

Complete business management area.

\# WEB PHASE 12

\# FINAL INTEGRATION, SECURITY, PERFORMANCE & PWA QA

Follow WEB\_POS\_MASTER\_CONTEXT.md.

Do not add new business modules.

This phase is for completing and auditing the browser application.

\==================================================

1\. FULL FLOW TEST

\==================================================

Test:

Login

Dashboard

Products

Categories

Inventory

Customers

Suppliers

Purchases

Expenses

POS

Checkout

Sales History

Returns

Reports

Employees

Branches

Settings

Subscription

\==================================================

2\. ROLE TESTING

\==================================================

Test:

Client Owner

Business Admin

Manager

Cashier

Verify each sees only allowed features.

\==================================================

3\. TENANT ISOLATION

\==================================================

Verify:

Client A cannot access Client B.

Test:

URLs

API calls

IDs

Search

Filters

Branch selection

\==================================================

4\. SUBSCRIPTION

\==================================================

Test:

Active

Trial

Expired

Suspended

Cancelled

Ensure UI responds correctly.

\==================================================

5\. FEATURE FLAGS

\==================================================

Test:

POS disabled

Inventory disabled

Reports disabled

Multi Branch disabled

The UI must react correctly.

Laravel remains security authority.

\==================================================

6\. RESPONSIVE

\==================================================

Test:

1920

1440

1280

1024

768

480

390

360

No:

horizontal overflow

broken navigation

overlapping modals

unusable tables

tiny buttons

\==================================================

7\. DARK MODE

\==================================================

Audit every page.

Ensure:

Text readable

Borders visible

Inputs readable

Tables readable

Modals readable

Dropdowns readable

No white-on-white or black-on-black problems.

\==================================================

8\. ACCESSIBILITY

\==================================================

Check:

Keyboard navigation

Focus states

Labels

ARIA where required

Contrast

Screen-reader semantics

Button names

\==================================================

9\. PERFORMANCE

\==================================================

Check:

API calls

Duplicate requests

Large lists

Images

Bundle size

Lazy loading

Caching

Search debounce

\==================================================

10\. ERROR HANDLING

\==================================================

Test:

401

403

422

429

500

Network failure

Show user-friendly errors.

\==================================================

11\. PWA FOUNDATION

\==================================================

Prepare browser application for PWA.

Include where appropriate:

Web App Manifest

App icons

Installability

Responsive shell

Do NOT implement browser offline transaction synchronization.

Desktop Electron will own the SQLite offline POS architecture.

\==================================================

12\. BROWSER COMPATIBILITY

\==================================================

Test:

Chrome

Edge

Safari

Ensure layout and functionality remain stable.

\==================================================

13\. CODE QUALITY

\==================================================

Check:

Duplicate components

Unused dependencies

Unused imports

Large components

Poor state management

API duplication

Hard-coded values

Hard-coded package names

Hard-coded business types

Refactor genuine issues.

Do not rewrite stable code unnecessarily.

\==================================================

14\. FINAL REPORT

\==================================================

Provide:

Completed modules

API endpoints

Pages

Components

Security results

Responsive results

Performance results

PWA status

Known limitations

Recommended next step

Do not start Electron automatically.

