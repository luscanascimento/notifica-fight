process.env["NODE_ENV"] ??= "test";
process.env["OIDC_ISSUER_URL"] ??= "http://127.0.0.1:8080/realms/notifica-test";
process.env["OIDC_AUDIENCE"] ??= "notifica-fight-api-test";
process.env["OIDC_JWKS_URL"] ??= "http://127.0.0.1:8080/realms/notifica-test/certs";
process.env["OIDC_ADMIN_ROLE"] ??= "notifica-admin-test";
