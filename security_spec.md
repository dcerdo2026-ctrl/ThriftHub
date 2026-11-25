# ThriftHub Security Specification (Phase 0)

## 1. Data Invariants
1. **User & PII Isolation**: `users/{userId}` contains PII (`email`, `phone`, `address`). Only the document owner (`request.auth.uid == userId`) or an administrator (`isAdmin()`) may read or update it.
2. **Prevent Self-Assigned Roles**: On `users/{userId}` creation, regular users must set `role == 'user'` and `isSuspended == false`. Only an admin can modify `role` or `isSuspended`, or write to `admins/{userId}`.
3. **Email Verification & Identity**: All authenticated writes require `request.auth.token.email_verified == true`. Document owner/author/buyer/seller UIDs must match `request.auth.uid`.
4. **Immutable Ownership & Timestamps**: `createdAt` and owner IDs (`uid`, `sellerId`, `buyerId`) cannot be mutated after creation. Server timestamp (`request.time`) is strictly enforced for `createdAt` and `updatedAt`.
5. **Catalog Integrity**: Sellers can only create/edit/delete their own `products/{productId}` (unless suspended) and cannot self-mark `featured: true` unless admin. Buyers can mark an `available` item as `sold` ONLY when placing a valid order.
6. **Order Isolation & Terminal Locks**: `orders/{orderId}` can only be read by `buyerId`, an involved `sellerIds` member, or an admin. Orders in terminal states (`delivered`, `cancelled`) are locked against non-admin modifications.
7. **Strict Schema & Size Guards**: Every write must match exact allowed keys (`hasAll` + `hasOnly`), type checks, enum bounds, and string/list `.size()` limits.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Promotion on Sign-up**: Create `/users/attacker` with `role: "admin"`. -> `PERMISSION_DENIED`
2. **Profile Role Escalation**: Update `/users/attacker` changing `role` to `"admin"` or `isSuspended` to `false`. -> `PERMISSION_DENIED`
3. **PII Snooping**: Non-admin user attempts `get` or `list` on `/users/victim`. -> `PERMISSION_DENIED`
4. **Unverified Admin Spoof**: Token with `email: "danielcerdo05@gmail.com"` and `email_verified: false` reads `/admins/any`. -> `PERMISSION_DENIED`
5. **Product Seller Spoofing**: User A creates `/products/p1` with `sellerId: "userB"`. -> `PERMISSION_DENIED`
6. **Product Shadow Field Injection**: Seller creates `/products/p1` with extra ghost key `isPromotedBySystem: true`. -> `PERMISSION_DENIED`
7. **Featured Hijack**: Regular seller creates or updates product setting `featured: true`. -> `PERMISSION_DENIED`
8. **Product Price Poisoning**: Seller creates product with `pricePhp: -500` or string `"100"`. -> `PERMISSION_DENIED`
9. **Client Timestamp Tampering**: Client submits `createdAt` from year 2099 instead of `serverTimestamp()`. -> `PERMISSION_DENIED`
10. **Cross-Tenant Order Snooping**: User C attempts `get` or `list` on `/orders/order1` belonging to Buyer A / Seller B. -> `PERMISSION_DENIED`
11. **Terminal Order Mutation**: Seller attempts to change an order with `status: "cancelled"` back to `"confirmed"`. -> `PERMISSION_DENIED`
12. **ID Poisoning / Buffer Exhaustion**: Client writes `/products/<150-char-invalid-id>` or `title` > 120 chars. -> `PERMISSION_DENIED`
