# Tributestream Technical Documentation

## Overview

Tributestream is a comprehensive memorial service platform that enables funeral directors and families to create digital memorials with integrated livestreaming capabilities. Built with SvelteKit, TypeScript, Firebase, and Cloudflare Stream.

## Documentation Structure

### Core Documentation
- [Data Models & Types](./01-data-models.md) - Complete TypeScript interfaces and data structures
- [API Routes Reference](./02-api-routes.md) - All API endpoints with request/response schemas
- [Component Architecture](./03-components.md) - Frontend component structure and relationships
- [Authentication & Authorization](./04-auth-system.md) - User roles, permissions, and access control
- [Livestream System](./05-livestream-system.md) - Complete livestreaming architecture and workflows

### System Architecture
- [Database Schema](./06-database-schema.md) - Firebase collections and document structures
- [Integration Flows](./07-integration-flows.md) - End-to-end workflows and data flows
- [External Services](./08-external-services.md) - Cloudflare Stream, Stripe, Firebase integrations
- [Utilities & Helpers](./09-utilities.md) - Shared functions and utility modules

### Development & Operations
- [Development Setup](./10-development.md) - Local development environment setup
- [Testing Strategy](./11-testing.md) - Test coverage and testing approaches
- [Deployment Guide](./12-deployment.md) - Production deployment procedures
- [Troubleshooting](./13-troubleshooting.md) - Common issues and debugging guides

## Quick Reference

### Key Technologies
- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: SvelteKit API routes with Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with custom claims
- **Livestreaming**: Cloudflare Stream with WHIP/RTMP protocols
- **Payments**: Stripe integration
- **File Storage**: Firebase Storage

### Core User Roles
- **Admin**: Platform administrators with full system access
- **Funeral Director**: Professional users who manage multiple memorials
- **Owner**: Family members who own and manage their memorial

### Main Collections
- `memorials` - Memorial service information and content
- `livestreamConfigs` - Booking and calculator data
- `streams` - Unified livestream management (new system)
- `funeral_directors` - Funeral director profiles and business information
- `users` - User authentication and profile data

### Key Features
- Memorial creation and management
- Multi-service livestreaming with visibility controls
- Automatic recording and archive management
- Role-based access control and permissions
- Payment processing and booking system
- Mobile streaming support via WHIP protocol
- Real-time status monitoring and webhooks

## Getting Started

1. Review the [Data Models](./01-data-models.md) to understand core data structures
2. Explore [API Routes](./02-api-routes.md) for backend integration patterns
3. Study [Component Architecture](./03-components.md) for frontend development
4. Understand [Livestream System](./05-livestream-system.md) for streaming features

## Version Information

This documentation reflects the current state of Tributestream as of September 2024, including:
- Svelte 5 migration with runes
- Unified livestream system (Version 2)
- Memorial service data model refactor
- Production-ready authentication system
- Comprehensive role-based access control

---

*Last updated: September 30, 2024*
