# Security Specification & Threat Model for AgentForge

## 1. System Invariants & Access Control Policy
- All operations require authenticated users (`request.auth != null`).
- Google Sign-In is the verified identity provider.
- Split-collection and strict UID scoping:
  - `/users/{userId}`: Users can only read and write their own profile document (`request.auth.uid == userId`).
  - `/threads/{threadId}`: Users can only access, create, update, or delete chat threads where `resource.data.ownerId == request.auth.uid` or `request.resource.data.ownerId == request.auth.uid`.
  - `/threads/{threadId}/messages/{messageId}`: Messages are subcollections under a thread. Users can only read/write messages in a thread they own (`get(/databases/$(database)/documents/threads/$(threadId)).data.ownerId == request.auth.uid`).
  - `/projects/{projectId}`: Projects can only be read, created, updated, or deleted by the document owner (`ownerId == request.auth.uid`).

## 2. The "Dirty Dozen" Threat Payloads (Must return PERMISSION_DENIED)
1. Unauthenticated read on `/users/attacker` -> PERMISSION_DENIED.
2. User A attempts to update User B's `/users/user-b` document -> PERMISSION_DENIED.
3. User A attempts to read User B's `/threads/thread-b` -> PERMISSION_DENIED.
4. User A attempts to list all threads across other users (`allow list` without owner check) -> PERMISSION_DENIED.
5. User attempts to inject a 2KB junk document ID (`isValidId` fails) -> PERMISSION_DENIED.
6. User attempts to write a message with `ownerId != request.auth.uid` (Identity Spoofing) -> PERMISSION_DENIED.
7. User attempts to write a message to a thread owned by someone else -> PERMISSION_DENIED.
8. User attempts to inject a 100KB payload into a title or string property (`maxLength` constraint) -> PERMISSION_DENIED.
9. User attempts to alter `ownerId` or `createdAt` on an existing thread (Immutability violation) -> PERMISSION_DENIED.
10. Unauthenticated write on `/projects/{projectId}` -> PERMISSION_DENIED.
11. User A attempts to mutate User B's `/projects/project-b` -> PERMISSION_DENIED.
12. Arbitrary write to undefined collection `/admins/{id}` or root `/{document=**}` -> PERMISSION_DENIED.
