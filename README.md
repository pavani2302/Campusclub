# Campus Club Management System

Java + Spring Boot + PostgreSQL campus club management project for an academic demo.

## Features
- Student registration/login
- Admin login
- Club listing and student membership
- Admin club creation
- Event creation and registration
- Event attendance management API
- Admin dashboard statistics
- Responsive frontend served by Spring Boot
- H2 local development database
- PostgreSQL/Supabase production database

## Demo accounts
- Admin: `admin@campusclub.com` / `admin123`
- Student: `student@campusclub.com` / `student123`

Change these credentials before using the project beyond a classroom demo.

## Run locally
Requirements: Java 17+ and Maven 3.9+.

```bash
mvn spring-boot:run
```
Open http://localhost:8080

The default local database is H2 and is stored under `./data`.

## Build
```bash
mvn clean package
java -jar target/campus-club-management-1.0.0.jar
```

## Deploy free with Render + Supabase
1. Create a Supabase project.
2. In Supabase Dashboard choose Connect and copy the JDBC/session-pooler connection information. Use the values supplied by Supabase; do not guess the pooler host.
3. Push this repository to GitHub.
4. Create a Render Web Service from the repository, select the Free plan and Docker runtime.
5. Add these environment variables:
   - `DB_URL` = Supabase JDBC URL
   - `DB_USERNAME` = Supabase username
   - `DB_PASSWORD` = Supabase database password
   - `DB_DRIVER` = `org.postgresql.Driver`
   - `DDL_AUTO` = `update`
6. Deploy and open the generated `onrender.com` URL.

Render free services can spin down after inactivity, so the first request after idle may take around a minute. Do not use the free tier as production infrastructure.

## Suggested PPT screenshots
- Home page
- Student login
- Student dashboard
- Clubs list
- Event registration
- Admin dashboard
- Database tables
