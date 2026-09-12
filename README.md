# NexusLearn

## AI-Powered Corporate Learning Management System

NexusLearn is a full-stack, AI-powered corporate Learning Management System (LMS) designed to transform uploaded SOPs and company policies into an interactive learning experience.

The platform uses Retrieval-Augmented Generation (RAG) to provide a document-grounded chat assistant and combines AI-generated learning material with adaptive learning algorithms to help employees understand organizational procedures, assess their knowledge, and track their readiness.

## Key Features

- **RAG-based AI Chat Assistant**
  - Answers questions from uploaded SOPs and policies.
  - Uses document-grounded retrieval rather than relying only on the LLM's general knowledge.
  - Supports token streaming for responsive conversations.

- **AI-Generated Scenario Flashcards**
  - Converts organizational documents into scenario-based learning material.
  - Uses strict JSON-oriented LLM pipelines for structured generation.
  - Includes deduplication and retry-on-undercount logic.

- **AI Assessments**
  - Generates assessments from organizational knowledge sources.
  - Supports automated evaluation as part of the learning workflow.

- **Personalized Growth Roadmap**
  - Uses learning and assessment performance to support personalized employee development.

- **Adaptive Learning**
  - Implements the **SM-2 spaced-repetition algorithm** for retention-oriented learning.
  - Uses a server-side weighted scoring formula:
    - 60% Assessments
    - 25% Mastery
    - 15% Retention

- **Project-Readiness / Fitness Scoring**
  - Combines learning performance signals to estimate an employee's readiness.

- **Role-Based Access Control**
  - Three roles:
    - Super Admin
    - HR
    - Employee
  - Uses JWT authentication and Google OAuth.
  - Includes an HR-approval gate.
  - Uses TTL-indexed email verification.
  - Authorization is enforced through FastAPI dependency-based guards.

- **Document Management**
  - Stores uploaded documents using MongoDB GridFS.
  - Uses Pinecone with per-document namespaces for vector retrieval.

- **SOP of the Day**
  - Uses APScheduler to run a scheduled SOP-of-the-Day job.

## Architecture

NexusLearn is implemented as a FastAPI backend with a React 18 single-page application.

### High-Level Flow

```text
                    ┌─────────────────────┐
                    │     React 18 SPA    │
                    │   Material-UI UI    │
                    └──────────┬──────────┘
                               │
                               │ REST API / SSE
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend  │
                    │   10 Modular Routers│
                    └──────┬──────┬───────┘
                           │      │
             ┌─────────────┘      └──────────────┐
             ▼                                    ▼
    ┌────────────────┐                   ┌─────────────────┐
    │    MongoDB     │                   │    Pinecone    │
    │  Data + GridFS │                   │ Vector Retrieval│
    └────────────────┘                   └────────┬────────┘
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │ LangChain + Groq │
                                         │ Llama 4 Scout    │
                                         │      17B         │
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ HuggingFace      │
                                         │ MiniLM Embeddings│
                                         └──────────────────┘
```

## RAG Chat Pipeline

The RAG chat system is built using LangChain, Groq Llama 4 Scout 17B, HuggingFace MiniLM embeddings, and Pinecone.

The response pipeline supports:

1. User submits a question.
2. Relevant document content is retrieved from Pinecone.
3. Retrieved context is passed into the LLM pipeline.
4. The response is generated from the retrieved knowledge.
5. Tokens are streamed to the client.
6. Server-Sent Events (SSE) deliver the streamed response to the React application.

Token streaming is implemented with a custom `AsyncIteratorCallbackHandler`.

## Vector Database

The vector layer was migrated from **FAISS to Pinecone**.

This migration:

- Eliminated cold-start index loading.
- Enabled horizontal scaling.
- Uses **per-document Pinecone namespaces** to isolate document vectors.

## Backend

The backend is implemented as a FastAPI monolith organized into **10 modular routers** with **40+ REST endpoints**.

Additional backend components include:

- MongoDB
- MongoDB GridFS
- Compound indexes
- TTL indexes
- LRU chain cache
- APScheduler
- JWT authentication
- Google OAuth
- FastAPI dependency-based authorization

## AI / LLM Stack

| Component | Technology |
|---|---|
| Backend | FastAPI |
| LLM | Groq Llama 4 Scout 17B |
| LLM Framework | LangChain |
| Embeddings | HuggingFace MiniLM |
| Vector Database | Pinecone |
| Primary Database | MongoDB |
| Document Storage | MongoDB GridFS |
| Frontend | React 18 |
| UI | Material-UI |
| Scheduling | APScheduler |
| Authentication | JWT + Google OAuth |
| Streaming | Server-Sent Events (SSE) |

## Learning & Scoring Engine

NexusLearn combines AI-generated learning content with algorithmic learning mechanics.

### Spaced Repetition

The platform implements the **SM-2 spaced-repetition algorithm** to support long-term knowledge retention.

### Weighted Learning Score

The server-side scoring formula is:

```text
Fitness Score =
    60% Assessments
  + 25% Mastery
  + 15% Retention
```

This score is used for adaptive learning and project-readiness fitness evaluation.

## Security & Access Control

NexusLearn implements a three-tier RBAC model:

```text
Super Admin
    │
    ├── HR
    │
    └── Employee
```

Authentication and authorization features include:

- JWT-based authentication
- Google OAuth
- HR approval workflow
- TTL-indexed email verification
- FastAPI dependency-based authorization guards

## Project Scale

The NexusLearn implementation contains approximately **14,000 lines of code** across the FastAPI backend and React 18 SPA.

The backend exposes **40+ REST endpoints** through **10 modular routers**.

## Engineering Highlights

### FAISS → Pinecone Migration

The vector retrieval layer was migrated from FAISS to Pinecone to remove cold-start index loading and make horizontal scaling possible.

### Streaming RAG

The RAG assistant uses Server-Sent Events together with a custom `AsyncIteratorCallbackHandler` to stream LLM output to the frontend.

### Structured LLM Pipelines

Five strict-JSON LLM pipelines were designed for structured AI generation, with deduplication and retry-on-undercount logic to improve reliability.

### Adaptive Learning

The learning engine combines SM-2 spaced repetition with a weighted server-side scoring system to connect assessment performance, mastery, and retention.

## Project Technology Summary

```text
Frontend
└── React 18
    └── Material-UI

Backend
└── FastAPI
    ├── 10 modular routers
    ├── 40+ REST endpoints
    ├── JWT authentication
    ├── Google OAuth
    └── Server-Sent Events

Data
├── MongoDB
├── MongoDB GridFS
└── Pinecone

AI
├── LangChain
├── Groq Llama 4 Scout 17B
└── HuggingFace MiniLM

Learning
├── SM-2 spaced repetition
└── Weighted fitness scoring

Scheduling
└── APScheduler
```

## Project Context

**NexusLearn** was developed as a Final Year Project.

**Role:** AI / Full-Stack Developer

The project demonstrates practical experience across RAG architectures, LLM integration, vector databases, backend API design, authentication, adaptive learning systems, and React-based application development.

## Setup & Deployment

The resume information used to create this README identifies the project's technology stack and architecture but does not provide the repository's exact installation commands, environment variables, folder structure, database configuration, or deployment procedure.

Those sections should be added from the project's actual source repository/configuration rather than inferred.

## Author

**Muhammad Huzaifa Bin Salman**

AI Engineer | NLP & LLM Systems | RAG Architectures | Machine Learning

Karachi, Pakistan
