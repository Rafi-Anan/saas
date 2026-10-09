# H2R Commerce

MERN commerce workspace with a responsive storefront, store-scoped commerce APIs, and an authenticated operations dashboard.

## Local setup

1. Install dependencies from the repository root:

	```bash
	npm install
	npm run install-all
	```

2. Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`.
3. Set a valid MongoDB connection string, a cryptographically random `JWT_SECRET` of at least 32 characters, and unique owner credentials in `server/.env`. The database user must be allowed to access the selected database. URL-encode reserved characters in the URI password.
4. To email order receipts, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM`. Without valid SMTP settings, orders still complete and invoices remain available on the checkout device.
5. Start both applications from the repository root:

	```bash
	npm run dev
	```

The API listens on port 5000. Vite starts on port 5173, or selects another available port. API health is available at `/api/health`; it returns 503 until MongoDB is connected. The initial store slug defaults to `demo`.

The first successful server startup creates the default store, migrates legacy single-store records without deleting them, and provisions the owner account if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Open `/admin/login` to sign in. Changing owner environment credentials does not reset an existing account password.

Admin users can also register at `/admin/register`. New registrations are created with role `pending`, cannot sign in, and receive no API privileges. After verifying the applicant, manually promote the account in MongoDB Compass or mongosh by setting its `adminusers.role` field to `admin`; the user can then sign in. Registration never accepts a role from the browser.

Optional product seed data can be added with `npm run seed --prefix server`; the command upserts demo products and does not delete store data.

## Implemented foundation

- Store model with slug/domain lookup, store-scoped product, order, customer, report, and landing-page queries.
- Tenant compound indexes and a non-destructive bootstrap for records from the original single-store schema.
- Storefront product listing, category/search/sort controls, variation selection, local cart, and server-priced checkout.
- Product creation for simple, virtual, and variable items with required cover images, optional galleries, color/size options, and SEO tags. Device uploads are size- and type-limited and stored under `server/uploads`.
- Product-linked landing-page drafts and publishing with draggable/reorderable sections, product video by URL or device upload, and a shared product checkout with Bangladesh district and delivery-rate validation.
- Printable order invoices at `/invoice/:orderNumber`, validated optional customer email, SMTP receipt delivery, and guest-order summaries saved in local browser storage and listed under Account.
- Per-store courier credential configuration for Steadfast, Pathao Courier, RedX, Paperfly, and eCourier. Credentials are encrypted at rest; configured providers can be assigned to orders.
- Admin login, signed expiring sessions, owner/manager/fulfillment/analyst route roles, in-memory login throttling, and mutation activity records.
- Product create/delete, order status management, customer delivery-success segments, summary reports, and CSV export.
- Order records capture IP/user-agent data, server-verified prices, stock changes, and status history.

## Production work still required

This repository is not yet a complete or production-certified Shopify/Elementor replacement. Before handling real stores or payments, complete and independently review:

- Persistent distributed rate limiting, secure cookie/CSRF session deployment, password reset/MFA, admin-user management, and authorization tests.
- Database transactions for order creation and inventory reservation; idempotency keys and reconciliation jobs.
- Full migration rehearsal and index rollout against a copy of production data before deployment.
- Payment provider adapters and verified webhook flows for SSLCommerz, bKash, and Nagad. The current prepaid choice does not charge a payment method.
- Real provider HTTP adapters for courier booking, cancellation, tracking, returns, and webhooks. Current courier support stores encrypted credentials and assigns a configured provider to an order; it does not yet create a shipment with the provider.
- IP allow/block rules and configurable fraud scoring; current records only collect request/customer signals and delivery outcomes.
- Complete category, variation/SKU, inventory transaction, coupon, review, media-storage, notification, custom-domain onboarding, and admin-user workflows.
- Replace local-disk product image uploads with persistent object storage or a durable shared volume before deploying multiple API instances.
- Advanced landing-page builder features such as a responsive canvas, columns, undo/redo, autosave, and reusable templates. Current builder supports product selection, draggable section order, video, draft/publish, and embedded checkout.
- Date-filtered product/category/courier analytics and Excel/PDF exports; current reports are summary JSON with CSV export.
- Automated API/UI tests, CI, monitoring, backups, privacy/retention policies, and deployment/security review.

Provider credentials must be configured in a secret manager and must never be committed to the repository.

Guest orders also create/update a customer record in MongoDB and are cached on the checkout device for invoice/history access. No customer password is set from the phone number: the last eight phone digits are guessable and should not be used as an account credential. A secure customer sign-in and password recovery flow requires a separate verified email/OTP activation step.
