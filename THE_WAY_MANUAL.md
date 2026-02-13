## 📖 Chapter: mobileSocialAdapter.ts
**Type:** Adapter
**Summary:** This file provides a single, self-contained adapter for social functionalities within the mobile application, encompassing data access, business logic, and external API interactions.

### 🔄 Data Flow
* **Ingress:** Data enters through the `MobileSocialAdapter` functions (`fetchFeed`, `likePost`, `createPost`), accepting user input and parameters. These functions delegate to the `SocialService`.  `SocialService` receives data and passes this to the repository layer. The repository itself is responsible for getting data from Supabase.
* **Egress:** Data exits through the `MobileSocialAdapter` functions, returning formatted `Post` objects (for `fetchFeed` and `createPost`) or void (for `likePost`). The data originally comes from Supabase, is formatted by the Repository, and then returned by the service.

### 🧠 Logic
1.  **Pure Helper Functions:** The file begins with pure functions (`toPostArray`, `toPost`) for data transformation. These functions are designed to be testable without external dependencies.
2.  **Zod Validation:** Input validation is performed using Zod schemas (`FeedQuerySchema`, `CreatePostInputSchema`, `UuidSchema`). These schemas ensure data integrity before it reaches the database.
3.  **Error Handling:** A custom `SocialRepositoryError` class provides typed error handling for repository-level failures, including the operation name for observability.
4.  **Repository Layer:** The `ISocialRepository` interface defines a contract for data access. The `SupabaseSocialRepository` class implements this interface, interacting with the Supabase database to fetch posts, insert likes, create posts, and retrieve the authenticated user ID.  Supabase is queried using the Supabase client library.
5.  **Service Layer:** The `SocialService` class orchestrates social operations using the injected repository. It provides methods for fetching a feed, liking a post, and creating a post. It also includes a `requireAuth` helper to ensure that operations are performed by authenticated users.
6.  **Adapter Layer:** The `MobileSocialAdapter` singleton provides a thin bridge between the application and the `SocialService`. It implements the `SocialAdapter` interface and delegates calls to the service.

### 🛡️ Safety & Config
*   **Row Level Security (RLS):** Assumed to be configured on the Supabase tables (`posts`, `likes`) to enforce data access policies based on user roles and permissions, though this is not directly visible in the code.
*   **Authentication:** The `getAuthenticatedUserId` function relies on Supabase Auth to retrieve the current user's ID. The `requireAuth` function enforces that a user is authenticated before performing certain actions.
*   **Input Validation:** Zod schemas are used to validate all inputs, preventing malicious or malformed data from reaching the database.


## 📖 Chapter: social.ts
**Type:** Type Definition (Data Transfer Objects and Validation Schemas)
**Summary:** Defines TypeScript types and Zod schemas for social features within the mobile application, optimized for local persistence and data transfer.

### 🔄 Data Flow
* **Ingress:** Data enters through user input in the mobile app, API responses, or data synchronization processes.
* **Egress:** Data is used for local SQLite database storage, data synchronization to the server, or internal transformations within the mobile app.

### 🧠 Logic
This file defines the data structures and validation logic for social features within the mobile application.

1.  **Schemas:** Defines Zod schemas (`PostVisibilitySchema`, `PostSchema`, `CreatePostDTOSchema`) for validating data. These schemas serve as the single source of truth for both type definitions and runtime validation.  The TypeScript types (`PostVisibility`, `Post`, `CreatePostDTO`) are derived directly from these schemas using `z.infer<>`.

2.  **Types:**  Declares TypeScript types (`PostVisibility`, `Post`, `CreatePostDTO`) representing the structure of social data, specifically posts and post creation requests. These types are optimized for local storage and synchronization, differing from the shared types in `@theway/types`. They use string-based datetimes and include fields for synchronization (though they are not explicitly present in the code snippet).

3.  **Validation Functions:** Provides pure functions (`parsePost`, `parseCreatePostDTO`) to parse and validate raw data against the Zod schemas. These functions throw ZodErrors if validation fails, allowing the caller to handle errors appropriately. This ensures that only valid data is stored locally or sent to the server.

4.  **Anti-Corruption Layer:** Implements an anti-corruption layer by defining separate types for mobile-internal use and shared types for API communication. This allows the mobile app's data structures to evolve independently of the server's.  Data transformation between these types should occur at the API and persistence boundaries.

### 🛡️ Safety & Config
*   **Validation:** Input validation is enforced through Zod schemas, preventing invalid data from being stored or transmitted.  The `parsePost` and `parseCreatePostDTO` functions provide a clear and safe way to handle data ingress.
*   **Data Integrity:** The types are designed to mirror the SQLite database schema, ensuring data integrity during local storage.

---


## 📖 Chapter: database.ts
**Type:** Repository
**Summary:** Defines the data structures and validation schemas for managing database updates and accessing Bible data within the mobile application.

### 🔄 Data Flow
* **Ingress:**
    *  Data enters through the `DatabaseUpdateSchema` when fetched from a remote API during update checks.
    *  Data is read from the local SQLite database into these types.
    *  User input can indirectly affect `UpdateCheckOptions`.
* **Egress:**
    *  Data is passed to the database update logic.
    *  Bible data is displayed to the user.
    *  `hasAvailableUpdate` returns a boolean to update logic.

### 🧠 Logic
This file contains:

1.  **Pure Logic Functions:**
    *   `hasAvailableUpdate`:  Compares two version numbers to determine if an update is available.  It's a pure function, taking two numbers and returning a boolean, with no side effects.
    *   `buildDatabaseUpdate`: Constructs a `DatabaseUpdate` object.  It ensures the `has_updates` flag is consistent with the version numbers and prevents manual inconsistencies. It shallow copies the `changes` array to preserve immutability.
    *   `formatBookReference`: Creates a standardized string representation of a Bible book reference (e.g., "Genesis 1:1").

2.  **Zod Schemas:**
    *   Defines Zod schemas for validating data at boundaries. Schemas exist for:
        *   `DatabaseChange`: Represents a single database change (insert, update, delete).
        *   `DatabaseUpdate`: Represents the entire database update payload.
        *   `UpdateCheckOptions`: Represents options passed when checking for updates (e.g., `force`, `silent`).
        *   `BibleBook`:  Represents a Bible book record.
        *   `BibleVerse`: Represents a Bible verse record.
        *   `StrongsDefinition`: Represents a Strong's concordance definition.
    *   These schemas are used to validate data from external sources (API, database) and user input, ensuring data integrity.

3.  **Inferred Types:**
    *   Defines TypeScript types (`DatabaseChange`, `DatabaseUpdate`, `UpdateCheckOptions`, `BibleBook`, `BibleVerse`, `StrongsDefinition`, `Testament`) by inferring them from the Zod schemas.  This ensures a single source of truth for data structures and avoids inconsistencies between schemas and types.

### 🛡️ Safety & Config
*   **Validation:** Zod schemas provide runtime validation for data entering the application, preventing invalid data from being processed. The `DatabaseUpdateSchema.parse(payload)` method should be used at boundaries (API response, SQLite read, etc.).
*   **Data Integrity:**  The pure functions (`hasAvailableUpdate`, `buildDatabaseUpdate`, `formatBookReference`) promote data integrity by ensuring consistency in data manipulation and representation.
*   **Immutability:** The shallow copy in `buildDatabaseUpdate` helps maintain immutability of the `changes` array within the `DatabaseUpdate` object.


## 📖 Chapter: videoEditorStore.ts
**Type:** Store
**Summary:** This store manages the state of a video editor, including the video and audio layers.
### 🔄 Data Flow
* **Ingress:**  User interactions via the `setVideo`, `setAudio`, `removeAudio`, and `reset` actions.
* **Egress:**  The store's state is consumed by video editor UI components to display and manipulate video and audio assets.
### 🧠 Logic
The `videoEditorStore.ts` file defines a Zustand store that manages the state of a video editor. It encapsulates the state and actions related to the video and audio layers. The store uses pure functions (`buildVideoState`, `buildAudioState`, `buildInitialEditorState`) to construct the state, ensuring testability and separation of concerns.

Here's a breakdown of the logic:

1.  **Default State:** `DEFAULT_AUDIO_STATE` and `DEFAULT_VIDEO_STATE` define the initial state for the audio and video layers, respectively. These are immutable constants to ensure a single source of truth for default values. The `satisfies` keyword is used to ensure that the default states conform to the `AudioLayerState` and `VideoLayerState` interfaces without widening the type.
2.  **State Construction:**
    *   `buildVideoState(uri, duration)`: Creates a new video layer state object with the provided URI and duration.
    *   `buildAudioState(uri, filename)`: Creates a new audio layer state object with the provided URI and filename, resetting the audio offset and volume to their default values.
    *   `buildInitialEditorState()`: Creates a new editor state object with the default video and audio layer states.
3.  **Zustand Store:**
    *   `useVideoEditorStore`: A Zustand store is created using the `create` function.
    *   **Initial State:** The store's initial state is set using `buildInitialEditorState()`.
    *   **Actions:** The store defines four actions:
        *   `setVideo(uri, duration)`: Sets the video layer state using `buildVideoState`.
        *   `setAudio(uri, filename)`: Sets the audio layer state using `buildAudioState`.
        *   `removeAudio()`: Removes the audio layer by setting the state to `DEFAULT_AUDIO_STATE`.
        *   `reset()`: Resets the entire editor state to its initial state using `buildInitialEditorState()`.

The use of pure functions for state construction ensures that the store logic is easily testable and maintainable. Each action within the store is a thin wrapper around these pure functions.

### 🛡️ Safety & Config
This store does not directly interact with any backend services or databases, therefore RLS and Auth are not applicable in this context. The safety of this module is provided by TypeScript interfaces that define data structures and expected data formats. The data handled is assumed to be URIs and metadata about video/audio assets, so no specific sensitive data handling is required. The `satisfies` keyword ensures type safety and catches typos at compile time.


## 📖 Chapter: api.ts
**Type:** Service
**Summary:** This service configures and maintains the API client, ensuring it stays synchronized with the Supabase authentication state.
### 🔄 Data Flow
* **Ingress:** Supabase authentication state changes via `supabase.auth.onAuthStateChange`.
* **Egress:** Updates the API client's authorization header via `api.setAuthToken`.
### 🧠 Logic
1.  **`resolveAuthToken` Function:** This pure function extracts the access token from a Supabase session object. It handles cases where the session or access token is `null` or `undefined` by returning an empty string.
2.  **`ApiClient` Instance:** A singleton instance of `ApiClient` is created, configured with the application's base URL (`API_BASE_URL`).
3.  **Authentication State Synchronization:** The `supabase.auth.onAuthStateChange` method listens for changes in the Supabase authentication state.  When a change occurs, the callback function is executed with the event and session data. The `resolveAuthToken` function is used to retrieve the access token from the session. The `api.setAuthToken` method then updates the API client's authorization header with the resolved token. The subscription to the auth state change is captured, allowing for later unsubscription if needed.
### 🛡️ Safety & Config
*   The `API_BASE_URL` constant defines the base URL for the API, which should be configured appropriately for different environments.
*   Row Level Security (RLS) should be enforced on the backend API to ensure users can only access data they are authorized to see. This service primarily focuses on authentication token propagation and does not directly enforce RLS. RLS is handled server-side.
*   The `authSubscription` allows for deterministic teardown of the subscription, preventing potential memory leaks.
---


## 📖 Chapter: BibleService.ts
**Type:** Service
**Summary:** Orchestrates access to Bible data, coordinating between the BibleEngine, the BibleRepository, and input validation.

### 🔄 Data Flow
* **Ingress:** HTTP requests (ultimately) to `getBooks`, `getChapter`, `getStrongsDefinition`, and `getVerseText`.  Data also enters internally via the `BibleRepository` singleton.
* **Egress:**  Formatted Bible data (books, chapters, verse text, Strong's definitions) to the HTTP response; errors to the HTTP response; calls to the `BibleRepository`.

### 🧠 Logic
The `BibleService` class provides static methods for accessing Bible data. It acts as a facade, simplifying interactions with the underlying `EngineBibleService` and `BibleRepository`.

1.  **Initialization:**  A singleton instance of `BibleRepository` is obtained and used to initialize an `EngineBibleService` instance.  This sets up the data access layer.
2.  **`getBooks()`:** Retrieves all books of the Bible by calling `engineService.getBooks()`.
3.  **`getChapter(bookId, chapter)`:** Retrieves the verses for a given chapter:
    *   Validates `bookId` and `chapter` using a Zod schema to ensure they are integers within acceptable ranges (bookId: 1-66, chapter >= 1).
    *   Calls `engineService.getFormattedChapter()` with the validated inputs.
4.  **`getStrongsDefinition(strongsId)`:** Retrieves a Strong's definition:
    *   Validates `strongsId` using the `StrongsIdSchema` to ensure it matches the format "H1234" or "G5678".
    *   Calls `engineService.getStrongsDefinition()` with the validated input.
5.  **`getVerseText(ref)`:** Retrieves the text for a specific verse reference (e.g., "JHN.3.16"):
    *   Calls the pure `parseVerseRef` function to parse and validate the reference string.
    *   If parsing fails (invalid format or unknown book), returns an error string formatted as `[Error Message]`.
    *   If parsing is successful, extracts the book name, chapter, and verse from the parsed reference.
    *   Calls `repository.getVerseText()` with the extracted values to fetch the verse text from the database.
    *   Returns the verse text or `null` if the verse is not found in the database.

The `parseVerseRef` function implements the logic for validating the verse reference format using `VerseRefSchema` and breaking down the reference to extract its components. It uses the `BOOK_CODE_MAP` constant to translate the 3-letter book code to the full book name.

### 🛡️ Safety & Config
*   **Input Validation:** Zod schemas are used to validate all inputs to the service methods, preventing invalid data from reaching the `EngineBibleService` and `BibleRepository`. This is crucial for security, preventing potential injection attacks or unexpected behavior.
*   **Pure Function:**  The `parseVerseRef` function is pure, meaning it has no side effects and its output depends only on its input.  This makes it easily testable and predictable.
*   **Constant Book Code Map:** The `BOOK_CODE_MAP` is a `Readonly` and `Object.freeze`'d constant, ensuring its integrity and preventing accidental modification.
*   **No RLS/Auth:** This service itself does not directly implement RLS or authentication. It relies on the underlying `BibleRepository` and potentially the `EngineBibleService` to handle any necessary authorization or row-level security.  It *does*, however, implement strict input validation to avoid potentially bypassing RLS checks in the repository.
---


## 📖 Chapter: supabase.ts
**Type:** Repository
**Summary:** This file initializes and exports a singleton Supabase client for the mobile application, ensuring secure and validated configuration.

### 🔄 Data Flow
* **Ingress:** Environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) via `process.env`.
* **Egress:** A configured Supabase client instance (`supabase`) for data access and authentication.

### 🧠 Logic
1. **Environment Validation:**
   - The `SupabaseEnvSchema` (Zod schema) defines the expected structure and constraints for the Supabase URL and Anon Key.
   - The `parseSupabaseEnv` function takes raw environment variables and validates them against the schema. If validation fails, it throws a `z.ZodError`, preventing the application from starting with invalid credentials.
   - During module load, `parseSupabaseEnv` is called to immediately validate environment variables.
2. **Supabase Client Initialization:**
   - The validated environment variables (URL and Anon Key) are used to initialize the Supabase client using `createClient`.
   - The client is configured with:
     - `AsyncStorage` for persistent session storage.
     - `autoRefreshToken` enabled to automatically refresh the user's session.
     - `persistSession` enabled to persist the session across app restarts.
     - `detectSessionInUrl` disabled, as it's not relevant for mobile applications.
3. **Singleton Export:**
   - The initialized Supabase client is exported as a singleton (`supabase`), ensuring that all parts of the application use the same client instance.

### 🛡️ Safety & Config
- **Environment Variable Validation:** The Zod schema enforces URL format for the Supabase URL and requires a non-empty Anon Key, preventing misconfiguration and potential security vulnerabilities.
- **Session Management:** Securely persists user sessions using `AsyncStorage`.
- **Row Level Security (RLS):** This file doesn't directly implement RLS, but the Supabase client it provides is the foundation for interacting with tables that *do* utilize RLS.  RLS rules should be defined in the Supabase project itself.  The client will enforce those rules when making requests.
- **Auth:** Uses the anon key, and also sets up session persistence.
---


## 📖 Chapter: MetadataRepository.ts
**Type:** Repository
**Summary:** Manages reading and writing key-value metadata within a local SQLite database table, providing an abstraction layer for data access.

### 🔄 Data Flow
* **Ingress:** Data enters through the `getValue` and `setValue` methods, accepting a key and optionally a value and timestamp.
* **Egress:** Data exits via the `getValue` method, returning a string or null.  Data is persisted to the SQLite database via `setValue`.

### 🧠 Logic
The `MetadataRepository` class provides static methods for interacting with the `database_metadata` table in the SQLite database.

1.  **`getConnection()`**:  Retrieves the SQLite database connection instance from the `BibleRepository` singleton.
2.  **`getValue(key: string)`**:
    *   Takes a `key` as input.
    *   Acquires a database connection.
    *   Executes a parameterized SQL query (`SQL_SELECT_VALUE`) to fetch the `value` associated with the given `key` from the `database_metadata` table.  Parameterized queries prevent SQL injection vulnerabilities.
    *   Calls `extractMetadataValue` to extract the value or return `null` if the key is not found.
    *   Returns the extracted value (string or null).
3.  **`setValue(key: string, value: string, now?: string)`**:
    *   Takes a `key`, `value`, and optional `now` timestamp (defaults to the current ISO-8601 timestamp).
    *   Acquires a database connection.
    *   Calls `buildUpsertParams` to generate an array of parameters for the SQL upsert operation.
    *   Executes a parameterized SQL query (`SQL_UPSERT_VALUE`) to insert or replace the key-value pair, updating the `updated_at` column with the provided timestamp.
    *   Returns `void`.
4.  **`extractMetadataValue(rows: ReadonlyArray<{ value: string }>)`**:
    *   A pure function that receives an array of rows as input.
    *   If the array has at least one element, it extracts the `value` from the first row.
    *   Otherwise, it returns `null`.
5.  **`buildUpsertParams(key: string, value: string, now: string)`**:
    *   A pure function that takes the `key`, `value`, and `now` timestamp as inputs.
    *   Returns a tuple containing these parameters, ready to be used in the SQL upsert query.

The class uses parameterized queries to prevent SQL injection and separates pure logic from data access concerns.

### 🛡️ Safety & Config
*   **SQL Injection Prevention:** All SQL queries use parameterized queries, mitigating the risk of SQL injection vulnerabilities.
*   **No direct RLS or Auth:** This repository directly interacts with the SQLite database.  RLS (Row Level Security) and authentication mechanisms would typically be implemented at a higher level (e.g., in the application logic calling this repository).  The data within the database is implicitly secured by the device's security and the app's sandboxed environment.
*   **Constants for SQL:** SQL queries and the table name are defined as `const` strings, preventing runtime interpolation and improving performance.
---


## 📖 Chapter: BibleRepository.ts
**Type:** Repository
**Summary:** Manages local SQLite database interactions for Bible data, including provisioning, querying, and searching.
### 🔄 Data Flow
* **Ingress:** User input from mobile app components (book/chapter selections, search queries, Strong's number lookups), and the bundled `bible.db` asset during initialisation.
* **Egress:** Bible data (books, verses, Strong's definitions) to mobile app components; database file to local filesystem.
### 🧠 Logic
The `BibleRepository` class provides access to Bible data stored in a local SQLite database.

1.  **Singleton Pattern:** Ensures only one instance of the repository exists.
2.  **Database Initialisation:** On first use, it checks if `bible.db` exists and is valid (size > 5MB). If not, it copies the bundled asset from the app package to the app's documents directory. The DB connection is cached after initialisation.
3.  **Data Retrieval:**
    *   `getBooks()`: Retrieves all Bible books ordered by ID.
    *   `getChapter(bookId, chapter)`: Retrieves all verses for a given book and chapter.
    *   `search(params)`: Performs a full-text search across all verses, escaping special characters in the query.
    *   `getStrongsDefinition(strongsId)`: Retrieves a Strong's Concordance definition by number.
    *   `getVerseText(bookName, chapter, verse)`: Retrieves the raw text of a single verse, using the book name instead of ID.
4.  **Input Validation:** Uses Zod schemas to validate all input parameters to all public methods.  This guarantees data types and ranges, and prevents SQL injection attacks.
5.  **Pagination:** The `search` method normalizes pagination parameters (limit and offset) to prevent unbounded queries, with a maximum page size of 100.
6.  **LIKE escaping**:  The `search` method escapes LIKE meta-characters (`%` and `_`) inside the user query to prevent SQL injection.

### 🛡️ Safety & Config
*   **No RLS or Auth:** This repository operates on a local, read-only database. No user authentication or row-level security is required.
*   **Zod Validation:** Protects against malformed input and SQL injection vulnerabilities.
*   **Safe defaults**: Sensible pagination bounds are enforced (limit ∈ `[1, 100]`, offset ≥ 0).
---


## 📖 Chapter: theme.ts
**Type:** Constants
**Summary:** Defines immutable theme constants (colors, fonts) for the mobile app, supporting light and dark modes.

### 🔄 Data Flow
* **Ingress:**  `Platform.select` for platform-specific font stacks. Overrides passed to `deriveColorScheme`.
* **Egress:** Exported `Brand`, `Colors`, and `Fonts` constants are consumed by UI components to style the application.

### 🧠 Logic
This module defines the application's theme in four key stages:

1.  **Brand Palette Definition:** Defines brand colors (purple and gold) as immutable objects with light, default, and dark variations. This serves as a single source of truth for brand colors.
2.  **Color Scheme Derivation:** The `deriveColorScheme` function takes scheme-specific overrides (text, background, tint, icon) and combines them with the brand palette to create a complete color scheme object. This is a pure function, enabling easy testing and future theme additions. The brand is referenced, avoiding duplication. Derived fields `tabIconDefault` and `tabIconSelected` are computed from the overrides.
3.  **Light & Dark Scheme Definition:** Defines light and dark color schemes by calling `deriveColorScheme` with appropriate overrides for each mode. These schemes are then stored in the `Colors` object, keyed by "light" and "dark".
4.  **Platform-Specific Font Selection:** Uses `Platform.select` from `react-native` to choose font stacks based on the platform (iOS, web, default).  This ensures appropriate font rendering on different devices. It enforces type safety by using a defined `FontFamilies` interface.

### 🛡️ Safety & Config
*   The `as const` assertion is used extensively to ensure immutability of all exported theme values. This prevents accidental modification of the theme at runtime.
*   No RLS or Auth is required because it is client-side theming for visual style and not sensitive data.


## 📖 Chapter: config.ts
**Type:** Constants
**Summary:** This module defines and exports the API base URL for the mobile application, resolving it based on the current environment (development or production) and platform.

### 🔄 Data Flow
* **Ingress:** Environment variables (`__DEV__`), Expo constants (`Constants.expoConfig?.hostUri`), Platform OS (`Platform.OS`).
* **Egress:** The `API_BASE_URL` constant, which is a string representing the fully-qualified API base URL.

### 🧠 Logic
1.  **`resolveLocalhost(os)`:**  This function takes the operating system (`ios` or other) as input and returns a platform-specific localhost address (`localhost:3000` for iOS or `10.0.2.2:3000` for Android emulators).
2.  **`deriveApiBaseUrl(isDev, hostUri, platform, port)`:** This function determines the API base URL.
    *   If the app is in development mode (`isDev` is true) and a `hostUri` is available (from Expo's Metro bundler), it constructs the URL using the host and the provided port (defaulting to 3000).
    *   Otherwise, it uses the `resolveLocalhost` function to get the appropriate localhost address for the platform and constructs the URL using that.
3.  **`API_BASE_URL`:** This constant is assigned the result of calling `deriveApiBaseUrl` with the current environment values (`__DEV__`, `Constants.expoConfig?.hostUri`, and `Platform.OS`).  `__DEV__` is a global boolean that indicates if the app is running in development mode. `Constants.expoConfig?.hostUri` is the address where the metro bundler is running (only present in development).

### 🛡️ Safety & Config
There are no specific RLS, Auth, or key constraints in this module.  The primary concern is ensuring the API base URL is correctly configured for different environments to prevent the app from connecting to the wrong server. The move to pure functions with explicit parameters prepares the module for future Zod validation to ensure stricter typing.
---


## 📖 Chapter: useSocialFeed.ts
**Type:** Hook
**Summary:** This hook provides a social feed with realtime updates, fetching posts, creating new posts, and handling errors, while ensuring data integrity and security.

### 🔄 Data Flow
* **Ingress:** User interactions (creating posts), Supabase realtime events (inserts, updates, deletes).
* **Egress:** `posts` (array of `Post` objects), `loading` (boolean), `error` (string or null), `createPost` (function to create a post), `isMfaRequired` (boolean), `refresh` (function to refetch posts).

### 🧠 Logic
1.  **Initialization:**
    *   Initializes state variables for `posts`, `loading`, `error`, and `isMfaRequired`.
    *   Uses `useRef` to track component mount status, preventing state updates after unmount.

2.  **Fetching Posts (`fetchPosts`):**
    *   Sets `loading` to true and `error` to null.
    *   Fetches posts from the `posts` table in Supabase, ordered by `created_at` in descending order (newest first).
    *   Handles potential Supabase errors using `handleSupabaseError`.
    *   Updates the `posts` state with the fetched data.
    *   Sets `loading` to false.

3.  **Creating Posts (`createPost`):**
    *   Validates the input `CreatePostDTO` using the `CreatePostSchema` (Zod).
    *   If validation fails, sets the `error` state and returns null.
    *   Authenticates the user using `supabase.auth.getUser()`.
    *   If the user is not authenticated, sets the `error` state and returns null.
    *   Inserts the new post into the `posts` table in Supabase using a parameterized query.
    *   Handles potential Supabase errors using `handleSupabaseError`, setting `isMfaRequired` if necessary.
    *   Returns the created `Post` object on success, or null on failure.

4.  **Realtime Subscription (useEffect):**
    *   Calls `fetchPosts` to load initial data.
    *   Subscribes to realtime changes on the `posts` table in the `public` schema.
    *   Uses a `switch` statement to handle `INSERT`, `DELETE`, and `UPDATE` events.
        *   `INSERT`: Calls `applyInsert` to prepend the new post to the `posts` state.
        *   `DELETE`: Calls `applyDelete` to remove the deleted post from the `posts` state.
        *   `UPDATE`: Calls `applyUpdate` to update the modified post in the `posts` state.
    *   Unsubscribes from the channel when the component unmounts to prevent memory leaks.

5. **Pure Logic Functions:**
    * `applyInsert`: Prepends a new post to the existing list of posts, ensuring no duplicates by checking the post's ID.
    * `applyDelete`: Removes a post from the list based on its ID.
    * `applyUpdate`: Updates an existing post in the list by replacing it with the updated version, based on matching IDs.

### 🛡️ Safety & Config
*   **Input Validation:** The `CreatePostSchema` (Zod) validates the `CreatePostDTO` to prevent invalid data from being inserted into the database. This protects against common attack vectors (e.g. script injection).
*   **Authentication:** The `createPost` function authenticates the user before inserting a new post.
*   **Realtime Updates:**  The hook subscribes to Supabase realtime events to keep the feed updated.  Row Level Security (RLS) policies on the `posts` table in Supabase control access to the data. If a user doesn't have permission based on RLS to `SELECT`, `INSERT`, `UPDATE`, or `DELETE` a post, the operation will fail.
*   **Error Handling:** The `handleSupabaseError` function is used to handle Supabase errors, and the `error` state variable is used to display errors to the user. The `isMfaRequired` state handles MFA requirements.
*   **Mount/Unmount Safety:** `mountedRef` prevents state updates after the component unmounts, avoiding memory leaks and React warnings.


## 📖 Chapter: useBiometricAuth.ts
**Type:** Hook
**Summary:** Provides biometric authentication functionality, including availability checks and authentication execution, while decoupling logic from UI for better testability.

### 🔄 Data Flow
* **Ingress:**
    *   From `LocalAuthentication` Expo module: `hasHardwareAsync`, `isEnrolledAsync`, `authenticateAsync`.
    *   Implicitly, user interaction with the biometric prompt.
*   **Egress:**
    *   React component using the hook receives `isBiometricSupported`, `isAuthenticated`, and the `authenticate` function.
    *   `Alert` component displays error messages to the user.

### 🧠 Logic
1.  **Capability Detection:**
    *   On mount, `useEffect` calls `LocalAuthentication.hasHardwareAsync` and `LocalAuthentication.isEnrolledAsync` to determine biometric hardware availability and enrollment status.
    *   `isBiometricAvailable(hardware, enrolled)`: A pure function that returns `true` only if both hardware is available and the user has enrolled biometric credentials.
    *   The result is stored in the `isBiometricSupported` state variable.
2.  **Authentication:**
    *   `authenticate`: An async function wrapped in `useCallback` to prevent unnecessary re-renders.
    *   Calls `LocalAuthentication.authenticateAsync` with predefined `DEFAULT_AUTH_OPTIONS` to trigger the biometric prompt.
    *   `interpretAuthResult(raw)`: A pure function that validates and interprets the raw result from `authenticateAsync` using `AuthResultSchema` and returns a discriminated union (`success | cancelled | failed`).
    *   A `switch` statement handles the different outcomes:
        *   `success`: Sets `isAuthenticated` to `true` and returns `true`.
        *   `cancelled`: Returns `false` (no error).
        *   `failed`: Displays an error alert and returns `false`.
3.  **Error Handling:**
    *   Both the capability detection and authentication processes include `try...catch` blocks.
    *   Errors during capability detection are logged but considered non-fatal.
    *   Errors during authentication are logged and displayed in an alert.
4.  **State Management:**
    *   `isBiometricSupported`: Tracks whether biometric authentication is available on the device.
    *   `isAuthenticated`: Tracks whether the user is currently authenticated using biometrics.

### 🛡️ Safety & Config
*   **Zod Validation:** `AuthResultSchema` validates the structure of the `authenticateAsync` result, ensuring type safety and preventing unexpected data from being processed. This also satisfies part of the security protocol (Data Validation).
*   **Cancellation Handling:** The `useEffect` includes a cleanup function that sets a `cancelled` flag to prevent state updates after the component unmounts, preventing memory leaks and crashes.
*   **Error Boundaries:** While this hook doesn't implement error boundaries directly, the error handling within the `try...catch` blocks and the display of alerts contribute to a more robust user experience by informing the user of failures.
*   **Immutable Options:** The use of `DEFAULT_AUTH_OPTIONS` as a `const` ensures that the authentication options are not accidentally modified, promoting predictability and stability.
---


## 📖 Chapter: useAdminSession.ts
**Type:** Component
**Summary:** This hook manages the lifecycle of an admin session for a user, providing a way to request, fetch, and track the session's validity.

### 🔄 Data Flow
* **Ingress:**
    *   Database: Fetches `expires_at` from the `admin_sessions` table.
    *   RPC: Receives `success` and `expires_at` from the `request_admin_access` function.
    *   `Date.now()`: Used as a reference point for calculating session validity (but injected for testability).
*   **Egress:**
    *   Component State: `session` state is updated with `AdminSessionState` based on fetched data or RPC response.
    *   UI: Returns `session`, `loading`, and `requestAccess` for use in the component.

### 🧠 Logic
1.  **Initialization:** On mount, the hook fetches the current user's admin session from the `admin_sessions` table.
2.  **Session Fetching:**
    *   It uses Supabase's `auth.getUser()` to get the current user.
    *   It queries the `admin_sessions` table for the user's session, selecting the `expires_at` column.
    *   If a session exists (i.e., `expires_at` is found), the `applyExpiry` function is called.
3.  **`applyExpiry` Function:** This function parses and validates the `expires_at` string using Zod schema (`ExpiresAtSchema`). It then calls `computeSessionState` to derive session state and update React state.
4.  **`computeSessionState` Function:** This is a *pure* function that takes the `expiresAt` string and the current time in milliseconds (`nowMs`) and returns an `AdminSessionState` object containing the expiration time, a boolean indicating if the session is active, and a human-readable string representing the remaining time.  If the session has expired, it returns `null`. The returned object is frozen to prevent accidental modification.
5.  **`requestAccess` Function:** This function calls the `request_admin_access` Supabase RPC to request elevated admin privileges.
    *   It validates the RPC response using the `AdminAccessResponseSchema` Zod schema.
    *   If successful, it calls `applyExpiry` to update the session state.
6.  **Periodic Refresh:** A `useEffect` hook sets up an interval that runs every `REFRESH_INTERVAL_MS` (60 seconds).
    *   The interval callback uses `expiresAtRef` to access the latest `expires_at` value without creating a stale closure.
    *   It calls `computeSessionState` to recalculate the session state and update the `session` state.
    *   If the session has expired, `expiresAtRef.current` is set to null.
7.  **Loading State:** The `loading` state is used to indicate whether the hook is currently fetching data or requesting access.

### 🛡️ Safety & Config
*   **Row Level Security (RLS):** The `admin_sessions` table should have RLS policies in place to ensure that users can only access their own session data.
*   **Authentication:** The hook relies on Supabase's authentication to identify the current user.
*   **Validation:** Zod schemas (`ExpiresAtSchema`, `AdminAccessResponseSchema`) are used to validate data from the database and RPC, preventing unexpected errors.
*   **Error Handling:** Errors from Supabase calls are caught and logged to the console.  The `requestAccess` function also displays an alert to the user.


## 📖 Chapter: use-theme-color.ts
**Type:** Hook
**Summary:** This hook provides a way to dynamically resolve color values based on the current system's color scheme (light or dark mode) and optional theme-specific overrides.

### 🔄 Data Flow
* **Ingress:**
    * `useColorScheme()` hook (from `@/hooks/use-color-scheme`) provides the current color scheme (`'light'` or `'dark'`).
    * Component props (`ThemeColorOverrides`) provide optional theme-specific color overrides.
    * `colorName` (SharedColorName) specifies the key of the color to retrieve from the shared color palette (`Colors`).
* **Egress:**
    *  A string representing the resolved color value for the current theme.

### 🧠 Logic
1.  **`resolveThemeColor` (Pure Function):**
    *   Takes the current `theme` (`'light'` or `'dark'`), optional `overrides` for theme colors, and a `colorName` as input.
    *   First checks if the `overrides` object contains a value for the current `theme`. If so, that value is returned.
    *   If no override is found, it retrieves the color value from the `Colors` object (using `Colors[theme][colorName]`) corresponding to the `theme` and `colorName`.
    *   Returns the resolved color string.

2.  **`useThemeColor` (React Hook):**
    *   Calls `useColorScheme()` to determine the current color scheme. If `useColorScheme()` returns null, it defaults to 'light'.
    *   Calls `resolveThemeColor` with the determined `theme`, provided `props` (overrides), and the given `colorName`.
    *   Returns the color string resolved by `resolveThemeColor`.

### 🛡️ Safety & Config
*   This hook relies on the `Colors` object defined in `@/constants/theme`, which should be carefully managed to ensure consistent color theming across the application. There are no explicit auth or RLS constraints. The safety of this hook depends on the correctness and completeness of the `Colors` theme definitions and the `useColorScheme` hook.


## 📖 Chapter: use-color-scheme.web.ts
**Type:** Hook
**Summary:** Provides a color scheme based on system preferences, defaulting to "light" before client-side hydration to prevent SSR mismatches.

### 🔄 Data Flow
* **Ingress:** System color scheme from `react-native`'s `useColorScheme` hook, and a boolean representing hydration status.
* **Egress:**  A string representing the resolved color scheme (`'light'` or `'dark'`).

### 🧠 Logic
The `useColorScheme` hook uses the following logic:

1.  **State Management:** It uses `useState` to track whether the component has hydrated on the client. Initially, `hasHydrated` is `false`.
2.  **Effect Hook:**  A `useEffect` hook runs once after the component mounts, setting `hasHydrated` to `true`.  This signifies that client-side rendering has occurred.
3.  **System Color Scheme:** It retrieves the system's color scheme using `useRNColorScheme()` from `react-native`. This will return `'light'`, `'dark'`, `null`, or `undefined`.
4.  **Resolution:** It calls the `resolveColorScheme` function to determine the final color scheme.  `resolveColorScheme` checks `hasHydrated`. If `false` (before hydration), it returns `DEFAULT_COLOR_SCHEME` (`'light'`).  If `true` (after hydration), it returns the system color scheme if it's available, otherwise it falls back to `DEFAULT_COLOR_SCHEME`.
5.  **Return Value:** The hook returns the resolved color scheme string.

### 🛡️ Safety & Config
There are no specific safety or configuration concerns related to RLS or Auth. Key constraints involve preventing a flash of incorrect theme by defaulting to `light` before hydration. `DEFAULT_COLOR_SCHEME` acts as the configuration here.

---


## 📖 Chapter: use-color-scheme.ts
**Type:** Hook
**Summary:** Provides a hook that returns the device's color scheme as a guaranteed non-null value, abstracting away React Native's nullable return type.

### 🔄 Data Flow
* **Ingress:** The device's color scheme is read by `useColorScheme` from React Native.
* **Egress:** A guaranteed `'light' | 'dark'` string representing the color scheme is returned by the custom `useColorScheme` hook.

### 🧠 Logic
1.  **`resolveColorScheme` Function:** This pure function takes a potentially nullable `ColorSchemeName` (from React Native) and returns a non-nullable `ResolvedColorScheme` (`'light'` or `'dark'`). If the input is `null` or `undefined`, it defaults to `'light'` (or a user-provided fallback). If the input is already `'light'` or `'dark'`, it returns the input value.
2.  **`useColorScheme` Hook:** This hook calls React Native's `useColorScheme` hook (`useRNColorScheme`) to get the device's current color scheme.
3.  **Null Safety:**  The value returned by `useRNColorScheme` (which can be `null`) is then passed to `resolveColorScheme` to guarantee a non-null result.
4.  **Return Value:** The `useColorScheme` hook then returns the non-null `ResolvedColorScheme` obtained from `resolveColorScheme`.

### 🛡️ Safety & Config
There are no specific RLS, authentication, or key constraints involved in this hook. It solely relies on the underlying React Native `useColorScheme` functionality and performs a transformation to guarantee a non-null return value.


## 📖 Chapter: modal.tsx
**Type:** Component
**Summary:** Defines the UI for a modal screen with configurable content, promoting testability and separation of concerns.

### 🔄 Data Flow
*   **Ingress:** None, the component internally uses `getDefaultModalContent` to generate the data.
*   **Egress:** The component renders UI elements based on the data.  Clicking the link navigates to the specified `linkHref`.

### 🧠 Logic

1.  **`ModalContent` Interface:** Defines a type for the modal content, including `title`, `linkLabel`, and `linkHref`.  The interface uses `readonly` properties, ensuring immutability.

2.  **`getDefaultModalContent()` Function:** A pure function that returns a default `ModalContent` object.  This function is designed to be easily testable without React Native dependencies.

3.  **`ModalScreen` Component:**
    *   Fetches modal content using `getDefaultModalContent()`.
    *   Renders a `ThemedView` container with a title and a link.
    *   The title is rendered using `ThemedText` with the `title` type.
    *   The link is rendered using `expo-router`'s `Link` component, navigating to `linkHref` and dismissing the modal.  The link text uses `ThemedText` with the `link` type.

4.  **Styles:**  Defines the layout and appearance using `StyleSheet.create`.

### 🛡️ Safety & Config

*   This component doesn't directly interact with any user data or backend services, therefore it is not exposed to RLS, auth, or other security risks. The `linkHref` property should point to a safe route within the application.
---


## 📖 Chapter: index.tsx
**Type:** Component
**Summary:** This file defines the root screen (`HomeScreen`) of the mobile application, displaying a formatted Bible verse.

### 🔄 Data Flow
* **Ingress:**  None (static data `SEED_VERSE` is used directly).
* **Egress:** The formatted verse text is rendered to the screen using `react-native`'s `Text` component.

### 🧠 Logic
The `HomeScreen` component retrieves a static `Verse` object (`SEED_VERSE`). It then utilizes the pure function `formatVerse` to convert this `Verse` object into a displayable string, which is subsequently rendered within a `Text` component. The `formatVerse` function relies on `formatReference` to create the book, chapter, verse string (e.g. "Genesis 1:1").

### 🛡️ Safety & Config
Currently, there are no specific Row Level Security (RLS) or authentication considerations, as the application uses static data. However, the documentation notes that Zod validation will be added when a Repository layer introduces external data. The component is also made accessible with `accessible`, `accessibilityRole`, and `accessibilityLabel` attributes.
---


## 📖 Chapter: _layout.tsx
**Type:** Component
**Summary:** This file defines the root layout component for the mobile application, handling authentication-based navigation and theme management.

### 🔄 Data Flow
* **Ingress:**
    *  `useAuth` hook provides authentication session data.
    *  `useSegments` hook provides the current route segments.
    *  `useColorScheme` hook provides the user's preferred color scheme.
* **Egress:**
    *  The `router.replace` function redirects the user based on authentication status and route.
    *  The `ThemeProvider` component provides the appropriate theme to the application.

### 🧠 Logic
1.  **`resolveAuthRedirect` Function:** This pure function determines the appropriate redirect path based on the user's authentication status and the current route segment.  If the user is not authenticated and is not on an authentication route (e.g., `/login`), it returns the path to the login page (`/(auth)/login`). If the user *is* authenticated and *is* on an authentication route, it redirects to the main application tabs (`/(tabs)`). Otherwise, it returns `null`, indicating no redirect is needed.
2.  **`RootLayoutNav` Component:** This component manages the navigation stack and performs authentication-based redirects.  It uses `useEffect` to:
    *   Introduce a delay to ensure the Expo Router navigation tree is fully mounted before attempting programmatic navigation using `NAVIGATION_READY_DELAY_MS`.
    *   Call `resolveAuthRedirect` whenever the authentication status (`session`), route segments (`segments`), loading state (`isLoading`), or navigation readiness (`isNavigationReady`) changes.  If `resolveAuthRedirect` returns a redirect path, `router.replace` is called to navigate to that path.
3.  **`RootLayout` Component:** This component serves as the outermost provider boundary. It wraps the `RootLayoutNav` component with the `AuthProvider` to make authentication state available to the entire application.  It also triggers a background check for database updates on mount using the `checkForDatabaseUpdates` function.

### 🛡️ Safety & Config
*   **Authentication:** The `AuthContext` and `useAuth` hook manage user authentication state. The `resolveAuthRedirect` function enforces authentication-based navigation.
*   **Error Handling:**  The database update check includes a `catch` block that logs any errors encountered during the update process, preventing the application from crashing. The `catch` block properly types the error as `unknown` for safety.
*   **Dependency Array:** The `useEffect` hook for authentication redirects includes `router` in its dependency array to ensure the effect is re-run whenever the router instance changes.


## 📖 Chapter: AuthContext.tsx
**Type:** Component
**Summary:** Provides authentication state to the application using React Context and Supabase auth.

### 🔄 Data Flow
* **Ingress:** Supabase `auth.getSession()` and `auth.onAuthStateChange()` provide the initial session and subsequent session updates.
* **Egress:** The `AuthState` object, containing the session, user, and loading state, is provided to the component tree via React Context.

### 🧠 Logic
1.  **Pure Functions:**
    *   `extractUserFromSession(session)`: Extracts the `User` object from a Supabase `Session` object. Returns `null` if no session is available.
    *   `deriveAuthState(session, isLoading)`: Combines a `Session` (or null) and a loading boolean into a complete `AuthState` object.  This ensures a consistent snapshot of the auth state.
2.  **Context Creation:**
    *   `AuthContext`: A React Context is created to hold the `AuthState`. It defaults to an initial loading state using `deriveAuthState(null, true)`.
3.  **`useAuth` Hook:**
    *   A custom hook, `useAuth()`, consumes the `AuthContext` and returns the current `AuthState`.  If used outside of an `AuthProvider`, it will return the initial loading state, effectively triggering a loading screen.
4.  **`AuthProvider` Component:**
    *   The `AuthProvider` is a React component responsible for managing the authentication state.
    *   It uses `useState` to hold the current `AuthState`.
    *   On mount (via `useEffect`), it fetches the initial session from Supabase using `supabase.auth.getSession()`. Upon receiving the session it updates the state using `setAuthState(deriveAuthState(session, false))`.
    *   It subscribes to Supabase's `auth.onAuthStateChange()` event to listen for authentication changes. On each event, the state is updated via `setAuthState(deriveAuthState(session, false))`.
    *   The subscription is unsubscribed when the component unmounts, preventing memory leaks.
    *   The `AuthProvider` wraps its children with `AuthContext.Provider`, making the `AuthState` available to all descendant components.

### 🛡️ Safety & Config
*   The `AuthState` interface uses `readonly` fields to ensure immutability, preventing accidental modifications of the authentication state by consumers.
*   The changes respect the principle of least privilege; consumers only have read access to the `AuthState`.
*   No direct database queries are performed within the component, and all authentication logic is handled by the Supabase client, leveraging its built-in security features and Row Level Security (RLS) configured on the Supabase backend.


## 📖 Chapter: themed-view.tsx
**Type:** Component
**Summary:** Provides a theme-aware `<View>` component that automatically applies background colors based on the current theme.

### 🔄 Data Flow
* **Ingress:**
    * `lightColor` and `darkColor` props (optional theme overrides).
    * `style` prop (optional consumer-provided styles).
    * Other `ViewProps` passed down to the underlying `<View>` component.
* **Egress:**
    *  Renders a `<View>` with a combined style prop (theme-aware background color merged with consumer styles).

### 🧠 Logic
1.  The `ThemedView` component accepts `lightColor` and `darkColor` props to customize the background color for light and dark themes, respectively. If not provided, the default "background" color from the theme is used.
2.  The `useThemeColor` hook resolves the appropriate background color based on the current theme.
3.  The `buildThemedViewStyle` function merges the resolved theme-aware background color with any consumer-provided `style` prop. It returns a deterministic style array, ensuring the theme background is applied first, allowing the consumer to override it.
4.  The resulting style array is applied to the underlying `<View>` component, along with any other props passed to `ThemedView`.

### 🛡️ Safety & Config
There are no specific RLS, Auth, or key constraints for this component. It relies on the `useThemeColor` hook, which in turn depends on the theme configuration. The `buildThemedViewStyle` function ensures that styling is composable without unexpected overrides.


## 📖 Chapter: themed-text.tsx
**Type:** Component
**Summary:** Provides a theme-aware `<Text>` component with pre-defined typographic styles, promoting testability and maintainability through a pure style resolution function.

### 🔄 Data Flow
* **Ingress:**
    * `ThemedText`: Receives `lightColor`, `darkColor`, `type` (string, defaults to 'default'), and standard `TextProps`.
    * `useThemeColor` hook: Receives `lightColor` and `darkColor` props.
    * `resolveTypeStyle`: Receives the `type` prop.
* **Egress:**
    * `useThemeColor` hook: Returns a `color` string based on the current theme.
    * `resolveTypeStyle`: Returns a `TextStyle` object (or undefined) based on the `type`.
    * `ThemedText`: Renders a `<Text>` component with combined styles (theme color, typographic style, and any additional styles passed via props).

### 🧠 Logic
1.  **Style Resolution:** The `resolveTypeStyle` function maps a `ThemedTextType` string to a corresponding `TextStyle` object. It uses a `typeStyleMap` which is a `Record` ensuring all defined types have a corresponding style. This mapping replaces a series of chained ternary operators for improved readability and performance. The function returns `undefined` if the provided `type` is null or undefined.
2.  **Theme Color Selection:** The `useThemeColor` hook determines the appropriate text color based on the current theme (light or dark) and the provided `lightColor` and `darkColor` props. If `lightColor` and `darkColor` are not provided it uses the default 'text' color from the theme.
3.  **Component Rendering:** The `ThemedText` component combines the resolved theme color, the typographic style from `resolveTypeStyle`, and any additional styles passed via the `style` prop into a single style array. This array is then applied to the `<Text>` component along with any other props passed to `ThemedText`.

### 🛡️ Safety & Config
*   The `typeStyleMap` is typed as `Readonly<Record<ThemedTextType, TextStyle>>`, which enforces type safety and prevents accidental modification of the style definitions. TypeScript will raise a compile error if a `ThemedTextType` doesn't have a corresponding entry in `typeStyleMap`, or if a non-`ThemedTextType` key exists.
*   The `resolveTypeStyle` function handles `null` or `undefined` input by returning `undefined`, preventing unexpected errors.
*   No specific RLS or Auth considerations are relevant for this component, as it focuses on styling and theming. It relies on the application's overall theme configuration.


## 📖 Chapter: parallax-scroll-view.tsx
**Type:** Component
**Summary:** This component implements a scroll view with a parallax effect on its header image, creating a visually appealing collapsing header animation.

### 🔄 Data Flow
* **Ingress:**
    *   `children`: React nodes to be rendered as the scrollable content.
    *   `headerImage`: React element to be rendered as the parallax header.
    *   `headerBackgroundColor`:  Object containing background colors for light and dark color schemes.
    *   `headerHeight`: (Optional) Height of the header. Defaults to `HEADER_HEIGHT`.
* **Egress:**
    *   Renders a `ScrollView` with animated header and scrollable content. The header's `translateY` and `scale` CSS properties are animated based on the scroll offset.

### 🧠 Logic
1.  **`computeParallaxTransform` Function:** This pure function calculates the `translateY` and `scale` values for the parallax effect based on the current scroll offset (`scrollY`) and header height (`headerH`). It uses `interpolate` from `react-native-reanimated` to map the scroll offset to the desired animation values. The function is designed to be testable without React Native runtime dependencies.
2.  **Component Functionality:**
    *   The `ParallaxScrollView` component takes `children`, `headerImage`, `headerBackgroundColor`, and an optional `headerHeight` as props.
    *   It uses the `useColorScheme` hook to determine the current color scheme (light or dark).
    *   It uses `useThemeColor` hook to get the appropriate background color.
    *   `useAnimatedRef` is used to create a ref to the `ScrollView` component, enabling animated scrolling.
    *   `useScrollOffset` is used to track the scroll offset of the `ScrollView`.
    *   `useAnimatedStyle` is used to create an animated style based on the scroll offset. It calls `computeParallaxTransform` to calculate the `translateY` and `scale` values and applies them to the header image's transform.
    *   The component renders an `Animated.ScrollView` containing an `Animated.View` for the header and a `ThemedView` for the scrollable content.

### 🛡️ Safety & Config
*   No specific RLS or Auth is applicable in this component.
*   Key configuration:
    *   `headerHeight`:  Determines the initial height of the header and influences the parallax effect.  It defaults to `HEADER_HEIGHT` which is 250, but it can be overridden via props.
    *   `headerBackgroundColor`:  Controls the background color of the header based on the color scheme. It *must* conform to the `HeaderBackgroundColor` interface.
---


## 📖 Chapter: hello-wave.tsx
**Type:** Component
**Summary:** Renders an animated waving-hand emoji using React Native Reanimated, with animation logic and configuration extracted for testability.

### 🔄 Data Flow
* **Ingress:**  None.  The component uses a default configuration for the animation.
* **Egress:** The rendered animated waving-hand emoji to the UI.

### 🧠 Logic
1.  **Animation Configuration:** The component imports `DEFAULT_WAVE_CONFIG`, which defines the animation parameters (peak rotation, swing duration, repetitions). This configuration is designed to be pure data, allowing for easy testing.
2.  **Shared Value:** `useSharedValue(0)` creates a shared value named `rotation` to store the current rotation angle of the hand.  Shared values are Reanimated's mechanism for cross-component state.
3.  **Animation Sequence:** The `useEffect` hook sets up the animation logic using Reanimated's animation primitives:
    *   `withTiming`: Creates a timing-based animation for each half-swing (rest to peak and peak to rest).  The `easing` function controls the animation's acceleration and deceleration.
    *   `withSequence`: Chains the two `withTiming` animations (rest → peak, peak → rest) together into a single sequence.
    *   `withRepeat`: Repeats the entire sequence for the specified number of `repetitions`.
    *   `rotation.value = ...`: Assigns the resulting animation to the `rotation` shared value, triggering re-renders as the animation progresses.
4.  **Animated Style:** `useAnimatedStyle` creates an animated style object that dynamically updates the `rotate` transform based on the `rotation.value`.  The `toRotationString` function converts the rotation angle from degrees to a CSS-style rotation string.
5.  **Rendering:** The `Animated.Text` component renders the waving-hand emoji with the animated style applied, causing it to rotate back and forth.  Static styles (fontSize, lineHeight, marginTop) are separated from animated styles for optimization.

### 🛡️ Safety & Config
*   No specific RLS or authentication is used in this component.
*   The animation's behavior is determined by `DEFAULT_WAVE_CONFIG`.  Changing these values directly alters the animation.


## 📖 Chapter: haptic-tab.tsx
**Type:** Component
**Summary:** This component provides a tab bar button that triggers light haptic feedback on iOS devices when pressed.

### 🔄 Data Flow
* **Ingress:**  `BottomTabBarButtonProps` are passed into the `HapticTab` component.  `process.env.EXPO_OS` is read to determine the platform.
* **Egress:** The component renders a `PlatformPressable` (a cross-platform pressable component) with modified `onPressIn` behavior.

### 🧠 Logic
1.  **Platform Check:** The `shouldFireHaptic` function determines if haptic feedback should be triggered based on the current platform (`process.env.EXPO_OS`). It returns `true` only for iOS.
2.  **`handlePressIn` Callback:** When the `PlatformPressable` is pressed, the `handlePressIn` function is executed.
    *   It first checks if haptic feedback is enabled for the current platform using `shouldFireHaptic`.
    *   If enabled, it triggers light haptic feedback using `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
    *   Finally, it calls the original `onPressIn` prop (if it exists) to execute any other press-related logic defined by the parent component.
3.  **Rendering:** The component renders a `PlatformPressable` component, passing through all the original props except `onPressIn`. It replaces the original `onPressIn` prop with the custom `handlePressIn` function to add haptic feedback.

### 🛡️ Safety & Config
*   The haptic feedback is only triggered on iOS devices as determined by `process.env.EXPO_OS`. This prevents errors or unexpected behavior on platforms that don't support haptics. The use of `PlatformPressable` provides graceful degradation on platforms where certain touch features aren't supported.
---


## 📖 Chapter: external-link.tsx
**Type:** Component
**Summary:** Provides a cross-platform link component that opens URLs in an in-app browser on native platforms and uses default browser behavior on the web.

### 🔄 Data Flow
* **Ingress:**
    *   `href`:  The URL to navigate to, passed as a string.
    *   `onPress`:  Optional callback function to execute when the link is pressed.
    *   `...rest`:  Any other valid props for the Expo Router `<Link>` component.
* **Egress:**
    *   The component renders an Expo Router `<Link>` component with modified `onPress` behavior.
    *   On native platforms, the specified URL is opened in an in-app browser using `expo-web-browser`.

### 🧠 Logic
1.  The `shouldOpenInAppBrowser` function determines if the link should be opened in an in-app browser based on the `process.env.EXPO_OS` environment variable.  If the `EXPO_OS` is not 'web', it returns `true`, indicating the in-app browser should be used.
2.  The `handleNativeLinkPress` function is responsible for opening the URL in the in-app browser. It prevents the default link navigation behavior using `event.preventDefault()` and then calls `openBrowserAsync` to display the URL within the app.
3.  The `ExternalLink` component receives a URL via the `href` prop. When the link is pressed:
    *   Any provided `onPress` handler is called first.
    *   The `shouldOpenInAppBrowser` function checks if the current platform is native (not web).
    *   If `shouldOpenInAppBrowser` returns `true`, the `handleNativeLinkPress` function is called to open the URL in the in-app browser.
    *   If `shouldOpenInAppBrowser` returns `false` (i.e., on web), the default `<Link>` behavior is preserved, and the link opens in the browser tab.

### 🛡️ Safety & Config
*   The component relies on the `EXPO_OS` environment variable to determine the platform.  It's crucial that this variable is correctly set during the build process to ensure the correct behavior on different platforms.  Incorrect configuration may lead to links not opening as expected.
*   No specific RLS or Auth considerations are present in this component. Standard web security practices apply to the URLs being opened.


## 📖 Chapter: SocialPostCard.tsx
**Type:** Component
**Summary:** Renders a single, styled social media post card, including user information, post content, optional Bible verse display, and interactive like/comment/share actions.

### 🔄 Data Flow
* **Ingress:** The `SocialPostCard` component receives a `post` object (of type `Post`) as a prop, along with optional `initialLikeCount` (number) and `initialLiked` (boolean) values. The `post` object contains data such as user ID, content, timestamp, visibility, and an optional verse reference.
* **Egress:** The component renders the post data to the UI. The `handleToggleLike` function updates the local like state, which could trigger an external API call (not shown, but implied) to persist the like change. The Bible verse, if present, is fetched via `BibleService.getVerseText`.

### 🧠 Logic
The `SocialPostCard` component operates as follows:

1.  **Initialization:** It receives a `post` object and optional initial like state. Local state is initialized for `liked` (boolean) and `likesCount` (number). Another state tracks verse loading and content.
2.  **Data Formatting:** The component uses pure functions (`formatUsername`, `formatTimestamp`, `visibilityIcon`, `formatLikeCount`) to format the data from the `post` object for display. This ensures testability and separation of concerns.
3.  **Like Toggling:** The `handleToggleLike` function uses the `toggleLikeState` reducer to update the `liked` and `likesCount` state based on the current state.  This change *only* updates the UI; persisting the like status requires an external API call (not part of this component).
4.  **Verse Fetching:** If the `post` object contains a `verse_ref`, a `useEffect` hook triggers the `BibleService.getVerseText` function to fetch the corresponding verse text.  A loading state is maintained to show a skeleton UI while fetching. An error is handled gracefully: if unavailable, a "Verse text unavailable offline" message is shown.
5.  **Rendering:** The component renders the formatted data in a card layout. It includes a header with user information, the post content, an optional Bible verse section, and a footer with like, comment, and share actions.

### 🛡️ Safety & Config
*   The component itself does not directly implement RLS or authentication. However, it *relies* on the `post` object, which should have been retrieved from an authenticated source with appropriate RLS applied.
*   The `BibleService.getVerseText` call is wrapped in a `try/catch` block to handle potential network errors or API failures. This prevents the component from crashing and provides a graceful fallback.
*   The `visibilityIcon` function defaults to 'lock-closed' for any unrecognized visibility value, providing a secure-by-default behavior.
*   The component uses descriptive `accessibilityLabel` props on `TouchableOpacity` elements to improve accessibility for users with disabilities.
*   The `initialLikeCount` and `initialLiked` props allow the parent component to manage the source of truth for like data, potentially fetching these values from a cache or the server.  This avoids inconsistent state caused by random initial values within the component.


## 📖 Chapter: ProfileHeader.tsx
**Type:** Component
**Summary:** The `ProfileHeader` component displays user profile information including banner, avatar, name, username, stats, and an "Edit Profile" button.

### 🔄 Data Flow
* **Ingress:** The component receives `displayName`, `username`, `avatarUrl`, `bannerUrl`, `stats` (posts, followers, following), and an optional `onEditProfile` callback as props.
* **Egress:** The component renders the profile header UI. Invokes the `onEditProfile` callback when the "Edit Profile" button is pressed.

### 🧠 Logic
1. **Data Validation:** On receiving props, the component validates the data using Zod schemas (`ProfileHeaderDataSchema`, `ProfileStatsSchema`). If validation fails, it falls back to using the original raw prop values.
2. **Stats Formatting:** The `buildFormattedStats` function converts the validated `stats` object (posts, followers, following) into an array of `FormattedStat` objects.  The `formatStatCount` function is used to format the numeric stat values (e.g., 1000 becomes "1K").
3. **Rendering:**  The component renders the banner, avatar, user info (display name, username), and formatted stats using sub-components (`Banner`, `Avatar`, `StatItem`). The "Edit Profile" button is also rendered, which triggers the `onEditProfile` callback when pressed. Each sub-component is responsible for rendering a specific part of the UI.

### 🛡️ Safety & Config
* **Zod Validation:** The Zod schemas `ProfileStatsSchema` and `ProfileHeaderDataSchema` enforce type safety and data integrity. They ensure that:
    * `displayName` and `username` are non-empty strings.
    * `avatarUrl` and `bannerUrl` are valid URLs (preventing potential XSS attacks from malicious URLs).
    * `stats` values (posts, followers, following) are non-negative integers.
* **Accessibility:** The "Edit Profile" button includes `accessibilityRole="button"` and `accessibilityLabel="Edit Profile"` for improved accessibility.
---


## 📖 Chapter: MobileStrongsModal.tsx
**Type:** Component
**Summary:** This component displays a modal containing the Strongs concordance definition for a selected word, fetched from the BibleService.

### 🔄 Data Flow
* **Ingress:**
    * `strongsId` (string | null): The Strongs ID to fetch the definition for.
    * `word` (string | null): The word to display in the modal header.
    * `visible` (boolean):  Controls the modal's visibility.
    * `onClose` (() => void):  Callback function to close the modal.
* **Egress:**
    * Data is visually rendered in a modal.
    * `onClose` is called when the user closes the modal.

### 🧠 Logic
1.  **State Management:** The component uses a discriminated union type `DefinitionState` to manage the state of the Strongs definition data fetching. The possible states are: `idle`, `loading`, `success`, and `error`.
2.  **Data Fetching:**
    *   The `useEffect` hook triggers the `loadDefinition` function when the `visible` prop and `strongsId` change. It also resets the state to `idle` when the modal is closed.
    *   `loadDefinition` uses `BibleService.getStrongsDefinition(id)` to fetch the Strongs definition based on the provided `strongsId`.
    *   The state is updated based on the outcome of the data fetching:
        *   `loading`:  While the data is being fetched.
        *   `success`: If the data is fetched successfully.  The fetched `StrongsDefinition` is stored in the `data` field.
        *   `error`: If there's an error during fetching.  An error message is stored in the `message` field. Also handles `null` data.
3.  **Display Logic:**
    *   The `deriveDisplaySections` function takes a `StrongsDefinition` object and transforms it into an array of `StrongsDisplaySection` objects, each containing a title and content to be displayed in the modal. This function is pure and testable.
    *   The component renders different content based on the current `DefinitionState`:
        *   `loading`: Displays an `ActivityIndicator`.
        *   `success`: Displays the sections derived from the `StrongsDefinition` using `deriveDisplaySections`.
        *   `error`: Displays an error message.
        *   `idle`: Displays nothing.
4.  **Modal Handling:** The component uses the `Modal` component from `react-native` to display the Strongs definition. The `visible` prop controls the modal's visibility, and the `onClose` prop is called when the user requests to close the modal.

### 🛡️ Safety & Config
*   There are no explicit RLS or Auth constraints within this component. The safety relies on the `BibleService.getStrongsDefinition` to handle any necessary authentication or authorization.
*   The `strongsId` prop is crucial; a missing or invalid `strongsId` will either result in no data being fetched or an error state.
*   The close button includes an accessibility label and role for improved accessibility.


## 📖 Chapter: CreatePostModal.tsx
**Type:** Component
**Summary:**  A modal component that allows users to create new posts with content, verse references, and visibility settings.

### 🔄 Data Flow
* **Ingress:** User input from text fields (`content`, `verseRef`), visibility selection, and the `visible` and `onClose` props.
* **Egress:**  Data is passed to the `createPost` function from the `useSocialFeed` hook.  The modal's visibility is controlled by the `onClose` prop.

### 🧠 Logic
1.  **State Management:** The component uses `useState` to manage the post `content`, `verseRef`, `visibility`, and `loading` state.
2.  **Validation:** The `validateNewPost` function validates the `content` and `verseRef` before submitting. It checks for empty content, maximum content length, and the correct verse reference format.  An alert is displayed if validation fails.
3.  **Post Creation:** The `handleCreate` function is triggered when the user presses the "Post" button. It calls the `createPost` function from the `useSocialFeed` hook with the content, verse reference, and visibility.
4.  **Error Handling:**  A `try...catch...finally` block handles potential errors during post creation.  Error messages are displayed in an alert. The `finally` block ensures `loading` is set to `false`, regardless of success or failure.
5.  **Form Reset:** The `resetForm` function resets the content, verse reference, and visibility to their initial states.
6.  **UI Rendering:** The component renders a modal with input fields for content and verse reference, a visibility toggle, and "Cancel" and "Post" buttons. The "Post" button displays an `ActivityIndicator` while loading.
7.  **Accessibility:** Visibility toggles include ARIA roles and labels for improved accessibility.

### 🛡️ Safety & Config
*   **Input Validation:** The `validateNewPost` function and `MAX_CONTENT_LENGTH` constant help prevent malicious or oversized input. Verse references are validated against a specific pattern (`VERSE_REF_PATTERN`) to ensure correct formatting.
*   **MFA Handling:** The component checks `isMfaRequired` from the `useSocialFeed` hook and displays an alert if multi-factor authentication is required.
*   No RLS or Auth is handled directly in this component, it is assumed this is handled in the `useSocialFeed` hook.

---


## 📖 Chapter: ComposePostModal.tsx
**Type:** Component
**Summary:** This component provides a modal interface for users to compose and post text content to the application, handling input validation, data persistence, and user feedback.

### 🔄 Data Flow
* **Ingress:** User input from the `TextInput` component, authentication session from `AuthContext`, `visible` and callback props (`onClose`, `onPostSuccess`) from the parent component.
* **Egress:** Data is sent to Supabase via the `insertPost` repository function. Success or failure is communicated to the parent component through callbacks and, in case of errors, displayed to the user via `Alert`. Navigation to the video creation page is triggered via `expo-router`.

### 🧠 Logic
1. **Component Initialization:**
   - The component receives a `visible` prop to control the modal's visibility, `onClose` to handle modal dismissal, and `onPostSuccess` to trigger a callback upon successful post creation.
   - It uses `useState` to manage the post content (`content`) and loading state (`loading`).
   - It retrieves the user session from `useAuth` and uses `useRouter` for navigation.

2. **Input Handling:**
   - The `TextInput` component captures user input and updates the `content` state.

3. **Validation (Pure Logic):**
   - `validatePostInput` validates the `content` against the `PostContentSchema`.  It ensures the content is not empty, trims whitespace, and does not exceed 5000 characters.  It also validates the user ID to ensure it is a valid UUID.
   - `isPostButtonDisabled` determines whether the "Post" button should be disabled based on whether the content is empty (after trimming) or if a post request is already in progress (`loading`).

4. **Authentication Check:**
   - Before attempting to create a post, the component verifies the user is authenticated (`session?.user`). If not, an alert is shown.

5. **Data Persistence (Repository):**
   - The `handlePost` function:
     - Validates the input using `validatePostInput`. If validation fails, an alert is displayed to the user.
     - Sets the `loading` state to true.
     - Calls `insertPost` to persist the validated post data to Supabase.
     - On success, clears the input, calls `onPostSuccess` and `onClose`.
     - On failure, displays an error alert to the user.
     - Finally, sets the `loading` state to false.

6. **Navigation:**
   - The `handleCreateVideo` function closes the modal and navigates the user to the video creation page using `router.push('/studio/create')`.

7. **UI Rendering:**
   - The component renders a modal with a header (cancel and post buttons), a content area (avatar and text input), and attachment options (verse and video).
   - The "Post" button's appearance and disabled state are dynamically updated based on the `disabled` variable.

### 🛡️ Safety & Config
- **Input Validation:** The `PostContentSchema` enforces input validation, preventing empty posts and limiting the content length to 5000 characters and ensuring a valid UUID. This mitigates potential security vulnerabilities related to excessive data or invalid user IDs.
- **Parameterised Queries:** The `insertPost` function uses parameterised queries via Supabase's `.insert()` method, preventing SQL injection vulnerabilities.
- **Authentication:** The component checks for a valid user session before attempting to create a post, ensuring that only authenticated users can create content.
- **Error Handling:**  The component includes a `try...catch` block to handle potential errors during the data persistence process. It displays user-friendly error messages using `Alert.alert`.
- **maxLength:** The `TextInput` component is configured with `maxLength={5000}` to prevent users from entering more than 5000 characters.

---


## 📖 Chapter: AdminSessionTimer.tsx
**Type:** Component
**Summary:** Displays the current admin session status and allows the user to request access if the session is inactive.

### 🔄 Data Flow
* **Ingress:** Data enters from the `useAdminSession` hook, specifically the `session` object (containing session details like `isActive` and `timeLeft`), the `loading` state, and the `requestAccess` function.
* **Egress:** The component renders a visual representation of the admin session status (loading spinner, active badge, or inactive button) to the user interface. When inactive and the user taps the button, the `requestAccess` function from `useAdminSession` is called.

### 🧠 Logic
1.  The component utilizes the `useAdminSession` hook to retrieve the current session state, a loading indicator, and a function to request admin access.
2.  The `deriveTimerState` function determines the component's render state ('loading', 'active', or 'inactive') based on the `loading` state and the `session?.isActive` property.  This function is pure and easily testable.
3.  Based on the derived state, the component renders one of three UI elements:
    *   **loading:** An `ActivityIndicator` is displayed.
    *   **active:** A green badge is displayed, showing "Admin Active" and the remaining `session?.timeLeft`.
    *   **inactive:** A tappable button is displayed, allowing the user to "Request Admin Access".  Pressing this button triggers the `requestAccess` function from the `useAdminSession` hook.

### 🛡️ Safety & Config
*   The component uses optional chaining (`session?.isActive`, `session?.timeLeft`) to safely access properties of the `session` object, preventing errors if the session data is not yet available or is null.
*   Accessibility features (`accessibilityRole`, `accessibilityLabel`) are added to enhance the user experience for users with disabilities. The accessibility labels dynamically update based on session state.
*   The component relies on the `useAdminSession` hook, which should handle authentication and authorization logic behind the scenes. The component itself does not implement any specific RLS or Auth mechanisms.


## 📖 Chapter: updateChecker.ts
**Type:** Service
**Summary:** This service checks for and applies database updates from a remote server, ensuring the app uses the latest data.

### 🔄 Data Flow
* **Ingress:** `checkForDatabaseUpdates` is called, optionally with `UpdateCheckOptions`.  Remote updates are fetched from the `api.database.checkForUpdates` endpoint.
* **Egress:** Database updates are applied to the SQLite database via `applyDatabaseChange`.  A notification is shown to the user if updates are applied successfully (unless `options.silent` is true).  The 'last_update_check' and 'data_version' metadata values are updated in the database.

### 🧠 Logic

The `checkForDatabaseUpdates` function orchestrates the update process:

1.  **Cooldown Check:**  It first checks if a cooldown period has elapsed since the last update check, using the `isWithinCooldown` function, which is a pure function, improving testability. If within the cooldown and `options.force` is not set, the function exits early.  The last check timestamp is read from the `database_metadata` table, key `last_update_check`.

2.  **Timestamp Recording:** If the cooldown has elapsed or `options.force` is true, it records the current timestamp as the last update check to prevent stampedes.

3.  **Version Retrieval:**  It retrieves the current database version from metadata storage (key `data_version`) using `readCurrentVersion` and parses it using the pure function `parseVersion`, which ensures a safe integer value.

4.  **Update Fetching:** It then fetches updates from the remote API using `fetchUpdates`, passing the current version.

5.  **Actionable Update Check:** `hasActionableUpdates` a pure function checks if the server response contains actionable updates (has_updates === true and changes array is populated). If not, the function exits.

6.  **Transaction Application:**  If updates are available, it obtains a database connection from the `BibleRepository` and applies the updates within a single SQLite transaction using `applyUpdatesInTransaction`. This function iterates through the changes from the `DatabaseUpdate` object and calls `applyDatabaseChange` for each change. It also updates the `data_version` in the database.

7.  **Notification:** Finally, it displays a user notification if updates were applied successfully and `options.silent` is not enabled.

### 🛡️ Safety & Config

*   The `applyUpdatesInTransaction` function uses parameterized queries when updating the `database_metadata` table, preventing SQL injection vulnerabilities (OWASP compliance).
*   The `isWithinCooldown` function prevents excessive update checks.
*   The service itself does not implement authentication. It relies on the `api` service for making authenticated requests to the backend.
*   No specific Row Level Security (RLS) is implemented directly within this service. The security is presumed to be handled by the API endpoint that provides the updates.


## 📖 Chapter: updateApplier.ts
**Type:** Repository
**Summary:** This module provides functions to apply validated database changes to a SQLite database, focusing on security and separation of concerns.

### 🔄 Data Flow
* **Ingress:** `DatabaseChange` objects representing insert, update, or delete operations.
* **Egress:**  SQL queries executed against the SQLite database via `expo-sqlite`.

### 🧠 Logic

The `updateApplier.ts` module orchestrates the application of database changes in a secure and structured manner.  It is broken down into pure logic functions and a repository layer for interacting with the database.

1.  **Validation and SQL Building (Pure Logic):**
    *   `buildSqlForChange`: This function acts as a router, directing incoming `DatabaseChange` objects to the appropriate SQL building function based on the `operation` property (`insert`, `update`, or `delete`). It throws a `ChangeValidationError` for unknown operations.
    *   `buildUpdateSql`, `buildInsertSql`, `buildDeleteSql`: These functions construct the SQL statements for their respective operations. Before building the SQL, they perform rigorous validation:
        *   `assertAllowedTable`: Ensures that the target table is present in the `ALLOWED_TABLES` allowlist.  This prevents operations on unauthorized tables.
        *   `assertSafeColumns`: Checks that all column names in the `data` and `where` clauses adhere to the `ALLOWED_COLUMN_PATTERN` regular expression, preventing SQL injection via dynamic identifiers.
    *   These functions generate a `SqlStatement` object containing the parameterized SQL string and an array of parameters.

2.  **Database Interaction (Repository Layer):**
    *   `applyDatabaseChange`: This function receives a `SQLite.SQLiteDatabase` instance and a `DatabaseChange`. It calls `buildSqlForChange` to get the validated SQL statement and parameters. Then, it executes the statement using `db.runAsync`, applying the change to the database.  Any `ChangeValidationError` thrown during the SQL building process is propagated, allowing the calling code to handle invalid changes.

### 🛡️ Safety & Config

*   **SQL Injection Prevention:** The module implements a multi-layered defense against SQL injection.
    *   **Table Allowlist:** The `ALLOWED_TABLES` constant defines a set of tables that the applier is permitted to modify. Any attempt to modify a table outside this list will result in a `ChangeValidationError`.
    *   **Column Validation:** The `ALLOWED_COLUMN_PATTERN` regular expression enforces a strict naming convention for column identifiers. This prevents the use of malicious column names designed to inject SQL code.
    *   **Parameterized Queries:** The generated SQL statements use parameter placeholders (`?`) for all data values. This ensures that data is treated as data and not as executable code.
    *   **Double-Quoting:** Table and column names are double-quoted in the generated SQL, preventing syntax escape.
*   **Error Handling:** The `ChangeValidationError` class provides a consistent way to signal invalid changes, allowing developers to catch and handle these errors appropriately.


## 📖 Chapter: login.tsx
**Type:** Component
**Summary:** This component provides a user interface for signing up and signing in using email and password, leveraging Supabase for authentication.

### 🔄 Data Flow
* **Ingress:** User input from `TextInput` components (email, password), component initialization (`isSignUp` state).
* **Egress:**  Validated credentials to Supabase Auth via `signUp` or `signIn` functions, navigation via `expo-router` on successful sign-in, alerts to the user via `Alert.alert` for validation errors, auth errors, or success messages.

### 🧠 Logic
1.  **State Management:** Uses `useState` hooks to manage the email, password, loading state, and sign-up/sign-in toggle (`isSignUp`).
2.  **Input Handling:** The `TextInput` components capture user input for email and password and update the corresponding state variables.
3.  **Validation:** When the user presses the Sign In / Sign Up button:
    *   The `validateCredentials` function (a pure function) validates the email and password using the `AuthCredentialsSchema` (Zod schema).
    *   If validation fails, an alert is displayed with the error message.
4.  **Authentication:** If validation succeeds:
    *   The `loading` state is set to `true` to display an activity indicator.
    *   If `isSignUp` is true, the `signUp` function is called, which attempts to sign up the user with Supabase Auth.  A success alert is shown.
    *   If `isSignUp` is false, the `signIn` function is called, which attempts to sign in the user with Supabase Auth. Navigation after successful sign in is implicitly handled by the auth state listener defined in the layout.
5.  **Error Handling:**  A `try...catch` block handles potential errors during the Supabase Auth calls.
    *   If an `AuthError` is caught, the error message is displayed in an alert.
    *   If any other error is caught, a generic error message is displayed.
6.  **Toggle Logic:** The `getToggleLabel` function (a pure function) determines the text for the sign-up/sign-in toggle button based on the `isSignUp` state.
7.  **Button Label Logic:** The `getButtonLabel` function (a pure function) determines the text for the primary button based on the `isSignUp` state.

### 🛡️ Safety & Config
*   **Zod Validation:** Uses Zod schema (`AuthCredentialsSchema`) to validate the email and password format on the client-side, preventing invalid data from being sent to Supabase. This schema enforces email format and minimum password length (8 characters), improving security by preventing basic attacks.
*   **Error Handling:**  Uses a typed `AuthError` class to encapsulate Supabase auth errors, preventing the leakage of raw Supabase error objects to the UI. This also allows for consistent error handling and display.
*   **Supabase Auth:** Uses Supabase Auth for user authentication, which provides secure password storage and management.
*   **Accessibility:** Implements accessibility features such as `accessibilityRole`, `accessibilityLabel`, `textContentType`, and `autoComplete` to improve the user experience for users with disabilities and provide iOS/Android autofill support.
*   **State Updates:** Uses the functional form of `setIsSignUp` (`setIsSignUp((prev) => !prev)`) to ensure safe state updates in concurrent React environments.

---

## 📖 Chapter: _layout.tsx
**Type:** Component
**Summary:** This file defines the layout for all unauthenticated screens within the mobile application.

### 🔄 Data Flow
* **Ingress:** None - This component primarily renders UI elements based on predefined configurations.
* **Egress:** Outputs a React component that renders the stack navigator and its screens.

### 🧠 Logic
This component functions as a layout provider for screens related to authentication (e.g., login, registration). It uses the `expo-router` library to define a stack navigator.  It iterates over the `AUTH_ROUTES` array, dynamically creating a `<Stack.Screen>` component for each route.  The `AUTH_SCREEN_OPTIONS` object provides default screen options (e.g., hiding the header) for all screens within this layout. The component is purely declarative, taking pre-defined data structures and rendering the appropriate UI elements.

### 🛡️ Safety & Config
There are no specific security considerations within this file itself, as it focuses on UI layout.  Auth gating and authentication logic are explicitly excluded and delegated to parent layouts or middleware. The `AUTH_SCREEN_OPTIONS` constant enforces type safety using `as const satisfies React.ComponentProps<typeof Stack>['screenOptions']`, preventing incorrect configuration.  The use of `AUTH_ROUTES` as a single source of truth reduces the risk of inconsistencies when managing route names.


## 📖 Chapter: read.tsx
**Type:** Component
**Summary:** This component displays a Bible chapter, allowing users to navigate between chapters and view Strong's information for individual words.

### 🔄 Data Flow
* **Ingress:**
    * `AsyncStorage` (for saved highlights)
    * `BibleService` (for book list and chapter verses)
    * User interactions (chapter navigation, word selection)
* **Egress:**
    * `MobileStrongsModal` (triggered by word selection)
    * UI rendering (Bible text, navigation controls)

### 🧠 Logic
1.  **Initialization:**
    *   On mount, fetches the list of Bible books and any saved highlights from `AsyncStorage`.
    *   Uses `Promise.all` to load in parallel.
    *   `parseHighlightsJson` safely parses the raw highlights string from local storage into a `Highlight[]`, using Zod validation to ensure data integrity and falling back to an empty array on failure.
2.  **Verse Fetching:**
    *   Fetches verses for the selected book and chapter using `BibleService.getChapter()`.
    *   A `cancelled` flag is used within the `useEffect` to prevent race conditions and state updates from previous, outdated requests when the user quickly changes chapters.
3.  **Rendering:**
    *   The `renderVerseText` function iterates through the verses and calls `parseVerseXml` to parse the XML content of each verse into tokens.
    *   `parseVerseXml` splits the verse XML into text and `<w>` elements (words with Strong's numbers). It returns an array of `ParsedToken` objects.
    *   The component renders each token as a `Text` element. If a token represents a word with a Strong's number, it's rendered as a clickable word, triggering the Strong's modal.
4.  **Navigation:**
    *   `handlePrevChapter` and `handleNextChapter` update the `selectedChapter` state, triggering a re-fetch of the verses for the new chapter.
    *   `clampChapter` ensures that chapter numbers stay within the valid range (minimum of 1).
5.  **Strong's Modal:**
    *   Clicking on a Strong's word triggers the `handleWordPress` function.
    *   `handleWordPress` sets the `selectedStrongsId` and `selectedWord` state, and makes the `MobileStrongsModal` visible.
    *   The `MobileStrongsModal` displays information about the selected Strong's number.
6.  **Book Name Resolution:**
    *   `resolveBookName` looks up the display name of the currently selected book using the list of books.
7.  **Pure Functions:**
    *   The component uses several pure functions (`parseVerseXml`, `resolveBookName`, `clampChapter`, `parseHighlightsJson`) to encapsulate logic and improve testability.

### 🛡️ Safety & Config
*   **AsyncStorage:** The app stores user highlights using `AsyncStorage`. Data from AsyncStorage is treated as untrusted.
*   **Zod Validation:** The `parseHighlightsJson` function uses Zod schemas (`HighlightSchema`, `HighlightsArraySchema`) to validate the structure and contents of the highlights data retrieved from `AsyncStorage`. This prevents unexpected errors or potential vulnerabilities due to malformed or malicious data.
*   **Cancellation:** The `useEffect` hook that fetches verses includes a cleanup function that sets a `cancelled` flag. This prevents state updates from asynchronous operations that have completed after the component has unmounted or the effect has been re-triggered, avoiding potential errors.


## 📖 Chapter: profile.tsx
**Type:** Component
**Summary:** This component renders the user's profile screen, displaying their posts, profile information, and a button to compose new posts.

### 🔄 Data Flow
* **Ingress:** The component receives the user session from the `AuthContext`. It also fetches post data from the Supabase database.
* **Egress:** The component renders the UI, including the user's profile information and a list of their posts. It also navigates to the edit profile screen and triggers the compose post modal.

### 🧠 Logic
1.  **Authentication Check:** The component first checks if a user session exists. If not, it displays a message prompting the user to log in.
2.  **Data Fetching:** If a session exists, the component fetches the user's posts from the Supabase database using the `fetchPostsByUserId` function.  The `loadPosts` function, wrapped in `useCallback` to prevent unnecessary re-renders, handles setting the `loading` state while fetching and updates the `posts` state with the fetched data.  A guard is in place to ensure `session?.user?.id` exists before attempting to fetch posts.
3.  **Profile Information Derivation:** The `deriveProfileIdentity` function extracts the user's display name and username from their email address.  The `computeProfileStats` function calculates the user's profile statistics (number of posts, followers, and following).
4.  **Rendering:** The component uses a `FlatList` to display the user's posts.  `renderPost` renders each post using the `SocialPostCard` component. `renderHeader` renders the `ProfileHeader` component, which displays the user's profile information and an "Edit Profile" button.  `renderEmpty` displays a message if the user has not yet posted.
5.  **Compose Post Modal:** The component displays a floating action button (FAB) that opens a `ComposePostModal` when pressed, allowing the user to create a new post. Upon successful posting, `loadPosts` is called to refresh the post list.

### 🛡️ Safety & Config
*   **Authentication:** The component relies on the `AuthContext` to manage user authentication. It displays a login prompt if no user session is available.
*   **Data Fetching:** The `fetchPostsByUserId` function fetches data from the Supabase database. Row Level Security (RLS) on the `posts` table ensures that users can only access their own posts. No direct `supabase` calls exist in the component itself.
*   **Accessibility:** The compose FAB includes `accessibilityLabel` and `accessibilityRole` attributes for screen reader support.


## 📖 Chapter: menu.tsx
**Type:** Component
**Summary:** This file defines the `MenuScreen` component, a top-level tab screen in the mobile application responsible for displaying settings and additional options.

### 🔄 Data Flow
* **Ingress:** None; the component consumes values from pure helper functions within the same file.
* **Egress:** None; the component renders UI elements.

### 🧠 Logic
The `MenuScreen` component functions as a thin orchestration layer. It retrieves the screen title and subtitle using the `getMenuScreenTitle` and `getMenuScreenSubtitle` functions, respectively.  It then renders these values within a `View` container, styled with a linear gradient header. The gradient configuration is defined by the `MENU_HEADER_GRADIENT` constant. The component utilizes `SafeAreaView` to ensure content is rendered within the safe area of the screen. The styling is managed through `StyleSheet.create`.

### 🛡️ Safety & Config
There are no specific RLS, Auth, or key constraints applied within this component directly. The component relies on the application's overall security context. The gradient colors are defined as a constant, which enhances predictability.
---


## 📖 Chapter: memorize.tsx
**Type:** Component
**Summary:** This component renders the Memorize tab screen, displaying a placeholder message while the scripture memorization feature is under development.

### 🔄 Data Flow
* **Ingress:** None. The component currently uses hardcoded data.
* **Egress:** None. The component renders the UI but doesn't send data elsewhere.

### 🧠 Logic
The `MemorizeScreen` component functions as follows:

1.  **Gradient Configuration:** The `getHeaderGradient()` function returns an object that configures the gradient colors, start, and end points for the header. This function encapsulates the gradient configuration, making it easier to manage and test.
2.  **Placeholder Content:** The `getPlaceholderCopy()` function returns an object containing the title and body text for the screen's placeholder content.  This function is designed to be replaced by a data source in the future.
3.  **Rendering:** The `MemorizeScreen` component retrieves the gradient configuration and placeholder copy using the functions described above. It then uses these values to render the UI, which consists of a `LinearGradient` for the header background and a `Text` component to display the title and body text.
4.  **Styling:** Styles are defined using `StyleSheet.create` and applied to the relevant components. A `HEADER_HEIGHT` constant is defined for the header height.

### 🛡️ Safety & Config
There are no specific RLS or authentication configurations in this component.  The component primarily displays static content.  No user data is processed or stored.
---


## 📖 Chapter: index.tsx
**Type:** Component
**Summary:** This file defines the HomeScreen component, which is the main landing page for the mobile app's tab navigation, displaying a personalized greeting and a placeholder for the user's daily dashboard.
### 🔄 Data Flow
* **Ingress:** The current hour is retrieved from the device's clock using `new Date().getHours()`.
* **Egress:** The `welcomeMessage` string is displayed within the HomeScreen component.
### 🧠 Logic
The `HomeScreen` component functions as follows:

1.  It obtains the current hour using `new Date().getHours()`.
2.  It calls `deriveGreeting(hour)` to determine the appropriate greeting based on the hour (e.g., "Good morning", "Good afternoon", "Good evening").
3.  It calls `buildWelcomeMessage(greeting)` to construct the complete welcome message by appending " — welcome back!" to the greeting.
4.  It renders the UI, which includes:
    *   A `LinearGradient` background for the header.
    *   A `SafeAreaView` to ensure content is displayed within the safe area of the screen.
    *   A title ("Home").
    *   The `welcomeMessage` as a subtitle.
    *   Placeholder text indicating where the daily dashboard content will be displayed.
### 🛡️ Safety & Config
There are no explicit RLS, Auth, or key constraints in this component. However, it relies on the device's time for the greeting, so incorrect time settings could affect the displayed greeting.
---


## 📖 Chapter: feed.tsx
**Type:** Component
**Summary:** This file defines the main social feed screen for the mobile application, displaying a list of social posts and handling user interactions like refreshing the feed.

### 🔄 Data Flow
* **Ingress:** Data enters via the `useSocialFeed` hook, which fetches social posts from the backend using the `MobileSocialAdapter`. User interactions (refresh, scroll) also act as ingress points, triggering data updates.
* **Egress:** The fetched social posts are rendered in a `FlatList` component, displayed to the user. User actions like refreshing the feed trigger network requests managed by `useSocialFeed`.

### 🧠 Logic
1.  **Data Fetching:** The `useSocialFeed` hook (from `@the-way/social-engine`) is responsible for fetching and managing the social feed data. It provides `posts`, `loading`, `refresh`, and `loadMore` properties/functions. `MobileSocialAdapter` is used to translate social engine data structures to mobile concerns.
2.  **Rendering:** The `FlatList` component iterates over the `posts` array and renders each post using the `SocialPostCard` component. The `renderPost` function is memoized using `useCallback` to prevent unnecessary re-renders of the list items.
3.  **Key Extraction:** The `extractPostKey` function is used as the `keyExtractor` for the `FlatList` to uniquely identify each post based on its ID. This is crucial for efficient list updates and rendering.  It's a pure function, decoupled from React for testability.
4.  **Empty State Handling:** The `FeedEmptyComponent` is displayed when there are no posts to show. The `resolveEmptyState` function determines whether to display a loading indicator or a "no posts yet" message based on the `loading` state. This logic is extracted into a pure function for testability. The `listEmptyComponent` is memoized with `useCallback` to prevent re-mounts.
5.  **Refresh and Pagination:** The `refresh` function is called when the user pulls down to refresh the feed. The `loadMore` function is called when the user scrolls to the end of the list, triggering pagination.  A threshold is set on the `onEndReachedThreshold` prop.
6. **Accessibility:** The refresh button includes `accessibilityRole` and `accessibilityLabel` to improve usability for users with disabilities.

### 🛡️ Safety & Config
*   The code relies on the `useSocialFeed` hook and `MobileSocialAdapter` to handle data fetching and potentially interact with a backend API. The security and configuration aspects of these components (e.g., authentication, authorization, API keys) are not directly visible in this file but are crucial for the overall security of the application.
*   Type safety is enhanced by using explicit types for `FlatList` and `ListRenderItemInfo<SocialPost>`.  `readonly` modifiers are used in prop definitions to promote immutability.

---


## 📖 Chapter: explore.tsx

**Type:** Component
**Summary:** This component displays community groups and upcoming events within the mobile app's "Explore" tab.

### 🔄 Data Flow
* **Ingress:** Data enters the component through two pure functions: `getUserGroups()` and `getUpcomingEvents()`. These functions currently return static data, but are designed to be replaced with repository calls in the future.
* **Egress:** Data is displayed to the user via the UI, formatted by presentational components (`GroupCard`, `EventCard`). No data is directly persisted or transmitted outside the component.

### 🧠 Logic
1.  **Data Fetching:** The `CommunityScreen` component calls `getUserGroups()` and `getUpcomingEvents()` to retrieve the data for groups and events, respectively.  These functions currently return hardcoded data.
2.  **Data Formatting:** The `formatMemberCount()` function formats the number of members in each group into a human-readable string (e.g., "128 members").
3.  **Rendering:** The component then maps over the `groups` and `events` arrays, rendering a `GroupCard` for each group and an `EventCard` for each event.
4.  **UI Composition:** The main component utilizes `SafeAreaView` to ensure content is displayed within safe areas of the screen. A `LinearGradient` provides a visual header background. Touch handlers provide accessibility.

### 🛡️ Safety & Config
This component does not directly interact with any backend services, databases, or authentication mechanisms. Data is currently static. Future implementations will require Row Level Security (RLS) and authentication checks within the repository layer (to be introduced) when retrieving data from a database.  Accessibility labels and roles are set on interactive elements for improved user experience.


## 📖 Chapter: _layout.tsx
**Type:** Component
**Summary:** This file defines the root tab layout for the mobile application using Expo Router, configuring the bottom navigation bar and handling tab visibility.

### 🔄 Data Flow
* **Ingress:**  `useColorScheme` hook provides the current color scheme (light/dark).
* **Egress:** Renders the `Tabs` component with dynamically generated `Tabs.Screen` components based on `VISIBLE_TABS` and `HIDDEN_TABS` constants.

### 🧠 Logic
1.  **Tab Configuration:** Two constant arrays, `VISIBLE_TABS` and `HIDDEN_TABS`, declaratively define the tabs that should be displayed in the bottom navigation bar and those that should be hidden but still accessible via programmatic navigation, respectively.  Each visible tab includes its route name, user-friendly title, SF Symbol icon, and icon size.
2.  **Color Scheme Resolution:** The `useColorScheme` hook provides the current color scheme of the device. The `resolveActiveTint` function, a pure function, then uses this scheme to determine the appropriate active tint color for the tab bar.  This ensures that the active tab icon and label are visually distinct based on the user's color preferences.
3.  **Dynamic Tab Rendering:** The `TabLayout` component renders the `Tabs` component from Expo Router.  It iterates over the `VISIBLE_TABS` and `HIDDEN_TABS` arrays, creating a `Tabs.Screen` component for each tab. The `name` property of each object in these arrays correlates to a file under the `/app/(tabs)/` directory. The `options` prop configures each tab's title and icon.  Hidden tabs have their `href` option set to `null`, preventing them from appearing in the tab bar.
4. **Haptic Feedback:** Uses the custom `HapticTab` component as the `tabBarButton` for each tab, providing haptic feedback on press.

### 🛡️ Safety & Config
*   No explicit RLS or authentication is handled in this file.  RLS or authentication would typically be implemented in the individual tab screen components or in the data fetching logic used by those components.
*   The `VISIBLE_TABS` and `HIDDEN_TABS` arrays act as configuration, dictating the structure of the tab navigation. Changes to these arrays directly impact the tab bar.
*   The `Colors` constant and `useColorScheme` hook are key dependencies for theming.
---


## 📖 Chapter: create.tsx
**Type:** Component
**Summary:** This component provides the UI for recording videos using the device camera and navigating to a preview screen.

### 🔄 Data Flow
* **Ingress:** Camera frames, user interactions (button presses), permission status from `expo-camera`, video URI from the camera.
* **Egress:** Video URI and duration to the `videoEditorStore`, navigation actions via `expo-router`.

### 🧠 Logic
The `StudioCreateScreen` component manages the camera recording process and the transition between camera and preview modes.

1.  **Permissions:** It uses `useCameraPermissions` to request camera permissions. If permissions are not granted, it displays a message and a button to request them.
2.  **State Management:** It maintains several state variables:
    *   `facing`: Camera direction (`'back'` or `'front'`).
    *   `isRecording`: Indicates whether the camera is currently recording.
    *   `videoUri`: The URI of the recorded video, or `null`.
    *   `mode`: The current UI mode, either `'camera'` or `'preview'`.
3.  **Camera Handling:** It uses the `CameraView` component to display the camera preview and record video.  The `cameraRef` is used to control recording.
4.  **Recording Logic:**
    *   `startRecording`: Initiates video recording using `cameraRef.current.recordAsync`. It sets `isRecording` to `true` and, upon successful recording, retrieves the video URI and duration.  It then calls `resolveRecordingResult` to validate the URI and then stores the video URI and duration in the `videoEditorStore` using the `setVideo` function. Finally, sets the `mode` to `'preview'`.
    *   `stopRecording`: Stops the ongoing recording using `cameraRef.current.stopRecording` and sets `isRecording` to `false`.
    *   `resolveRecordingResult`:  Validates the `video?.uri` by checking if the URI exists and is not an empty string. If valid, returns an object containing the URI and `MAX_RECORDING_DURATION_S`.
5.  **UI Mode Handling:** The `deriveDisplayMode` function determines the UI to display based on the `videoUri` and the `mode` state. If in `'preview'` mode and a `videoUri` exists, it displays the video preview; otherwise, it displays the camera view.
6.  **User Interactions:**
    *   `handleToggleFacing`: Toggles the camera direction.
    *   `handleDiscard`: Clears the video URI and returns to camera mode.
    *   `handleNext`: Placeholder for future video processing and post-creation logic.
    *   `handleOpenMusicSheet`: Opens the `MusicPickerSheet`.
    *   `handleCloseMusicSheet`: Closes the `MusicPickerSheet`.
    *   `handleGoBack`: Navigates back using `expo-router`.
7.  **Pure Functions:**
    *   `toggleFacing(current: CameraType)`: A pure function that toggles the camera facing direction between 'back' and 'front'.
    *   `resolveRecordingResult(uri: string | undefined)`: A pure function that validates the video URI and returns an object with the URI and duration, or null if the URI is invalid.
    *   `deriveDisplayMode(videoUri: string | null, explicitMode: 'camera' | 'preview')`:  A pure function that determines the display mode based on the video URI and explicit mode.

### 🛡️ Safety & Config
*   The component requests camera permissions using `useCameraPermissions`.
*   The maximum recording duration is limited to `MAX_RECORDING_DURATION_S` (60 seconds).
*   Error handling is implemented around the `recordAsync` call to catch and display recording errors.
*   No specific RLS or Auth considerations are present in this component. The component's logic is primarily focused on camera interaction and UI management.
---


## 📖 Chapter: _layout.tsx

**Type:** Component
**Summary:** This file defines the layout for the `/studio` route group in the mobile app, configuring navigation and status bar appearance.

### 🔄 Data Flow
* **Ingress:** None - this component primarily configures navigation.
* **Egress:** Configuration data is passed to the `expo-router` Stack component to define screen layouts and options.

### 🧠 Logic
This component uses `expo-router`'s `Stack` component to define the navigation structure for the `/studio` route group.
1.  It imports `Stack` from `expo-router` and `StatusBar` from `expo-status-bar`.
2.  `STUDIO_STACK_OPTIONS` defines default navigation options applied to all screens within the stack (hiding the header by default).  It's typed with `NativeStackNavigationOptions` for safety.
3.  `STUDIO_SCREENS` is an array of screen configurations. Each object in the array specifies the route `name` and any screen-specific `options` (e.g., overriding `headerShown`).
4.  The `StudioLayout` functional component renders a `Stack` component.
5.  The `screenOptions` prop of the `Stack` component is set to `STUDIO_STACK_OPTIONS`, applying the default options.
6.  It iterates over `STUDIO_SCREENS` and dynamically creates `<Stack.Screen>` components for each screen configuration. This allows easily adding new screens by modifying the `STUDIO_SCREENS` array.
7.  A `StatusBar` component is included to ensure the status bar has a light color scheme.
8. Values are preferred over objects to make the data more inspectable and testable.

### 🛡️ Safety & Config
This component focuses on UI layout and navigation configuration. It does not directly interact with databases or implement authentication logic. No RLS concerns.
---


## 📖 Chapter: icon-symbol.tsx
**Type:** Component
**Summary:** Provides a cross-platform icon component that uses SF Symbols on iOS and Material Icons on Android/web, mapping SF Symbol names to their Material Icon equivalents for consistent rendering.

### 🔄 Data Flow
* **Ingress:**  `IconSymbolProps` (name, size, color, style, weight) are passed into the `IconSymbol` component. The `name` prop is of type `IconSymbolName`, which is a key of the `MAPPING` object.
* **Egress:** The resolved Material Icon name, size, color, and style are passed as props to the `MaterialIcons` component, which renders the icon.

### 🧠 Logic
1.  **Icon Mapping:** The `MAPPING` object stores a correspondence between SF Symbol names (used on iOS) and Material Icon names (used on Android/web). This mapping is essential for cross-platform icon consistency.
2.  **Name Resolution:** The `resolveIconName` function takes an `IconSymbolName` as input. It looks up the corresponding Material Icon name in the `MAPPING` object.  If the provided `sfName` isn't found in `MAPPING`, the function throws an `Error` to prevent unexpected behavior and aid debugging.
3.  **Component Rendering:** The `IconSymbol` component receives props like `name`, `size`, `color`, and `style`.  It calls `resolveIconName` to get the Material Icon name equivalent of the `name` prop. Finally, it renders the `MaterialIcons` component, passing the resolved name, size, color, and style. The `weight` prop (SF Symbol weight hint) is ignored by this component since it targets Android/web.

### 🛡️ Safety & Config
*   The `MAPPING` object is declared `as const satisfies IconMapping` ensuring that `IconSymbolName` is a narrow union, giving callers compile-time safety.
*   The `resolveIconName` function performs runtime validation, throwing an error if an invalid `IconSymbolName` is provided. This ensures that developers are notified immediately if they are using an unsupported icon name. This promotes a fail-fast approach.


## 📖 Chapter: icon-symbol.ios.tsx
**Type:** Component
**Summary:** Renders a native iOS SF Symbol using the `expo-symbols` library, providing a consistent way to display icons across the application on iOS devices.

### 🔄 Data Flow
* **Ingress:**  `IconSymbolProps` (name, size, color, style, weight) are passed into the `IconSymbol` component.
* **Egress:** The `IconSymbol` component renders a `SymbolView` component, passing the processed props (including styles built by `buildIconStyle`) to it.

### 🧠 Logic
1.  **`buildIconStyle(size, style)`:** This function takes the desired `size` of the icon and any additional `style` overrides. It creates a style array. The first element sets the `width` and `height` of the icon to the provided `size`. The second element is the consumer-provided `style` override (which can be undefined). This function's sole purpose is to pre-compute styles before the component renders.
2.  **`IconSymbol({ name, size = 24, color, style, weight = 'regular' })`:**  This is the main component function.
    *   It receives the SF Symbol `name`, `size` (defaulting to 24), `color`, `style`, and `weight` (defaulting to 'regular') as props.
    *   It calls `buildIconStyle` to generate the composed style array based on the size and any provided styles.
    *   It renders a `SymbolView` component from the `expo-symbols` library. The `SymbolView` is configured with the provided `weight`, `tintColor`, `resizeMode`, `name`, and the computed `style`.

### 🛡️ Safety & Config
This component relies on the `expo-symbols` library, which in turn relies on the availability of SF Symbols on the iOS platform.  The `name` prop should correspond to a valid SF Symbol name to ensure proper rendering. No specific RLS or Auth constraints are relevant for this component as it purely handles UI rendering.


## 📖 Chapter: collapsible.tsx
**Type:** Component
**Summary:** Provides a reusable, accessible, and theme-aware collapsible section component for React Native applications.

### 🔄 Data Flow
* **Ingress:**
    * `children`: React nodes to be rendered within the collapsible section.
    * `title`: String to display as the collapsible section's header.
* **Egress:**
    * Renders a `ThemedView` containing a touchable heading and conditionally renders the `children` based on the `isOpen` state.
    * Emits a visual change to the UI when the collapsible is toggled (chevron rotation).
    * Updates the `accessibilityState` for screen readers.

### 🧠 Logic
The `Collapsible` component manages its open/closed state using the `useState` hook.  When the heading (wrapped in `TouchableOpacity`) is pressed, the `toggle` function (memoized with `useCallback`) updates the `isOpen` state, triggering a re-render. The component leverages two pure functions, `resolveIconColor` and `chevronRotation`, to determine the icon color and rotation based on the current color scheme (obtained via the `useColorScheme` hook) and the `isOpen` state, respectively.  These pure functions enhance testability, as they can be tested without mocking React context or platform dependencies.  The conditional rendering of the `children` is determined by the `isOpen` state. Accessibility attributes are applied to the touchable heading to provide information to screen readers.

### 🛡️ Safety & Config
The component relies on the `useColorScheme` hook to determine the current color scheme.  The default color scheme is set to 'light' as a fallback. The `activeOpacity` prop on the `TouchableOpacity` is set to `0.8` to provide visual feedback when the heading is pressed. Accessibility is enhanced through the use of `accessibilityRole`, `accessibilityState`, and `accessibilityLabel` props to improve the user experience for users with disabilities.  No specific RLS or Auth constraints are enforced within this component itself.


## 📖 Chapter: edit.tsx
**Type:** Component
**Summary:** This component provides the UI and logic for users to edit their profile information, including username, bio, and avatar.

### 🔄 Data Flow
* **Ingress:**
    * `AuthContext`:  Used to access the current user's session information.
    * User input from `TextInput` components for username and bio.
    * Image selected from the device's image library.
* **Egress:**
    * `supabase`:  Data is sent to Supabase to update the `profiles` table and upload avatars to storage.
    * `expo-router`:  Navigates back to the previous screen upon successful save.
    * `Alert`: Displays error messages to the user via alerts.

### 🧠 Logic
1. **Initialization:**
   - The component fetches the user's profile data from Supabase upon mounting, using the user ID from the `AuthContext`.
   - The fetched data (username, bio, avatar URL) is used to populate the component's state variables.
2. **Image Selection:**
   - The `pickImage` function uses `expo-image-picker` to allow the user to select an image from their device.
   - The selected image's URI and base64 representation are stored in the component's state. The avatar URL is immediately updated for a local preview.
3. **Data Validation:**
   - The `handleSave` function is triggered when the user presses the save button.
   - It validates the username and bio using the `validateProfileForm` function, which leverages the `ProfileFormSchema` for validation. An error alert is shown if validation fails.
4. **Avatar Upload (Conditional):**
   - If a new image has been selected (`imageFile?.base64` is truthy), the `uploadAvatar` function is called to upload the image to Supabase storage.
   - `buildAvatarPath` is used to generate a unique file path for the avatar in Supabase storage based on user ID and a random nonce (for cache-busting).
5. **Profile Update:**
   - The `buildProfileUpdate` function constructs the payload for updating the user's profile in the `profiles` table, including the username, bio, and the URL of the uploaded avatar (if any).
   - The `upsertProfile` function updates the `profiles` table in Supabase with the new profile data.
6. **Navigation:**
   - Upon successful profile update, the component navigates back to the previous screen using `router.back()`.
7. **Error Handling:**
   - Error handling is implemented throughout the component, displaying alerts to the user when errors occur during data fetching, validation, image uploading, or profile updating.
   -  The loading state is managed to display an activity indicator during asynchronous operations and disable the save button to prevent multiple submissions.

### 🛡️ Safety & Config
* **Row Level Security (RLS):**  The Supabase functions (`fetchProfile`, `uploadAvatar`, `upsertProfile`) rely on RLS policies configured on the Supabase tables (`profiles`) and storage (`avatars`) to ensure that users can only access and modify their own data.  The `profiles` table likely has a policy that allows a user to select, update, and insert where `id = auth.uid()`. The `avatars` storage bucket likely has a policy ensuring files are stored within a directory named for the `auth.uid()`.
* **Authentication:** The component relies on the `AuthContext` to ensure that the user is authenticated before performing any data operations.  The `session?.user` object is checked before attempting to load or save profile data.
* **Input Validation:** The `ProfileFormSchema` uses Zod to enforce constraints on the username and bio fields, preventing injection attacks and ensuring data integrity. The username is restricted to alphanumeric characters and underscores, and both username and bio have length restrictions.
* **Error Handling:** Try/catch blocks are implemented to capture errors.
---


## 📖 Chapter: MusicPickerSheet.tsx
**Type:** Component
**Summary:** A modal bottom sheet component that allows users to select music tracks, either from recommended tracks or from their device's files, for use in video editing.

### 🔄 Data Flow
* **Ingress:**
    * `visible: boolean` and `onClose: () => void` props determine the visibility and close behavior of the modal.
    * `RECOMMENDED_TRACKS: readonly AudioTrack[]` provides a static list of pre-defined audio tracks.
    * `DocumentPicker.DocumentPickerResult` from the device's file system, when the user chooses to pick a file.
* **Egress:**
    * `setAudio(uri: string, name: string)` from the `useVideoEditorStore` updates the video editor's state with the selected audio track's URI and name.
    * `onClose()` is called to close the modal sheet after a selection is made or when the user explicitly closes it.

### 🧠 Logic
1.  **Component Initialization:** The `MusicPickerSheet` component receives a `visible` prop to control the modal's visibility and an `onClose` prop to handle modal closure.  It retrieves `setAudio` from the `useVideoEditorStore` to update the application's audio state.
2.  **File Picking:**
    *   The `handlePickDocument` function is responsible for opening the device's file picker using `DocumentPicker.getDocumentAsync`. It filters for audio files (`type: 'audio/*'`) and copies the selected file to the cache directory.
    *   The `extractPickedAudio` function then processes the `DocumentPickerResult`. If a valid audio file is picked (not canceled, has assets), it extracts the URI and name into a `PickedAudio` object, otherwise it returns `null`.
    *   Upon successful file selection and extraction, `setAudio` is called to update the video editor store, and `onClose` is called to close the modal.  Errors during the file picking process are caught and logged.
3.  **Recommended Track Selection:**
    *   The `handleSelectTrack` function is called when a user selects a track from the `RECOMMENDED_TRACKS` list.
    *   The `trackToPickedAudio` function transforms the selected `AudioTrack` object into a `PickedAudio` object (containing `uri` and `name`).
    *   The `setAudio` function is called to update the store with the audio details, and `onClose` is invoked to close the modal.
4.  **Rendering:** The component renders a `Modal` containing a `ScrollView` with two sections:
    *   A "Pick from Files" button that triggers `handlePickDocument`.
    *   A "Recommended" section that iterates through `RECOMMENDED_TRACKS` and renders each track as a selectable item.
5.  **Accessibility:** Interactive elements (`TouchableOpacity`) have `accessibilityLabel` and `accessibilityRole` set for screen reader support.

### 🛡️ Safety & Config
*   The `RECOMMENDED_TRACKS` array is frozen using `Object.freeze` to prevent accidental modification, ensuring data integrity.
*   No specific RLS or Auth are enforced within this component.  Audio file access relies on the permissions granted to the Expo DocumentPicker.
*   Error handling includes a `try...catch` block in `handlePickDocument` to handle potential errors during the file picking process.  The caught error is logged for debugging purposes (TODO: Surface to observability).


## 📖 Chapter: VisualRepost.tsx
**Type:** Component
**Summary:** Renders a compact, single-level preview of a reposted Post, primarily focusing on displaying the author, content, and a video preview if available.

### 🔄 Data Flow
* **Ingress:** A `Post` object passed in as a prop.
* **Egress:**  Rendering of UI elements (View, Text, Image, VideoPreview) based on the `Post` data.

### 🧠 Logic
The `VisualRepost` component receives a `Post` object as a prop and renders a preview of that post.  It includes:

1.  **Avatar:** Displays the author's avatar using the `resolveAvatarUri` function to handle potentially missing or invalid avatar URLs, defaulting to a placeholder image.
2.  **Display Name:**  Displays the author's display name using the `resolveDisplayName` function, which defaults to "Unknown" if the username is not available.
3.  **Content:** Renders the post's content, limiting it to three lines using `numberOfLines={3}`. The content is conditionally rendered and will not render if `post.content` is falsy.
4.  **Video Preview:**  If the post has a `media_type` of "video" and a valid `media_url`, a `VideoPreview` component is rendered, displaying the video from the given `media_url`. The `shouldShowVideoPreview` function determines this.

Recursive reposts are intentionally omitted to prevent infinite rendering loops.

The component uses React Native's `StyleSheet` API to define styles for the various UI elements, including container, header, avatar, name, and content.

### 🛡️ Safety & Config
- The `resolveAvatarUri` and `resolveDisplayName` functions use `.trim()` to prevent issues with whitespace-only strings.
- The `accessibilityLabel` is set on the avatar `Image` to improve accessibility.
---


## 📖 Chapter: VideoPreview.tsx
**Type:** Component
**Summary:** Renders an inline video player with a play-icon overlay that appears when the video is paused.

### 🔄 Data Flow
* **Ingress:** `uri` (string) prop provides the video source. The `onPlaybackStatusUpdate` prop of the `<Video>` component receives `AVPlaybackStatus` updates from the `expo-av` library.
* **Egress:** The `isPlaying` state, derived from `AVPlaybackStatus`, controls the visibility of the play icon overlay.  The `Video` component renders to the screen.

### 🧠 Logic
1.  **`deriveIsPlaying(status: AVPlaybackStatus): boolean`**: This pure function determines if the video is currently playing based on the `AVPlaybackStatus` object provided by `expo-av`. It returns `true` only if `status.isLoaded` and `status.isPlaying` are both true. Otherwise, it returns `false`, indicating the video is not actively playing (e.g., loading, paused, buffering).
2.  **`VideoPreview` Component**:
    *   It initializes a `videoRef` using `useRef` to potentially interact with the underlying `Video` component instance (though currently unused).
    *   It uses `useState` to manage the `isPlaying` boolean, which determines whether the play icon overlay is displayed.
    *   The `handlePlaybackStatusUpdate` function, created using `useCallback`, is triggered whenever the playback status of the `Video` component changes. It calls `deriveIsPlaying` to update the `isPlaying` state based on the new status.
    *   The `Video` component is configured with:
        *   `source={{ uri }}`:  Specifies the video source using the `uri` prop.
        *   `useNativeControls`: Enables the native video player controls provided by the platform.
        *   `resizeMode={ResizeMode.COVER}`:  Scales the video to cover the entire container, potentially cropping it.
        *   `isLooping`:  Causes the video to loop continuously.
        *   `onPlaybackStatusUpdate={handlePlaybackStatusUpdate}`:  Registers the callback function to be executed whenever the video playback status changes.
    *   The play icon overlay is conditionally rendered when `isPlaying` is `false`. The `pointerEvents="none"` attribute ensures that the overlay does not intercept any touch events, allowing the user to interact with the underlying video controls.

### 🛡️ Safety & Config
*   This component does not directly implement any specific Row Level Security (RLS) or authentication mechanisms.  The security of the video content relies on the URI provided and the underlying video streaming infrastructure. The component itself is purely presentational.
*   The video `uri` prop is expected to be a valid and accessible URI.  Invalid or inaccessible URIs will likely result in errors within the `expo-av` `Video` component.


## 📖 Chapter: VerseQuote.tsx
**Type:** Component
**Summary:** Renders a styled block quote for displaying scripture verses, ensuring proper formatting and accessibility.

### 🔄 Data Flow
* **Ingress:**  The `VerseQuote` component receives the scripture `text` and `reference` as props.
* **Egress:** The component renders a `View` containing the formatted verse text and reference to the screen.

### 🧠 Logic
1.  **Props:** The component receives `reference` and `text` props of type `string`.
2.  **Formatting:**
    *   The `formatVerseText` function formats the verse `text` by trimming whitespace and wrapping it in typographic quotation marks (U+201C and U+201D). It handles cases where the input text is already quoted to avoid double-wrapping, normalizing to typographic quotes in such cases. If the trimmed text is empty, it returns an empty string.
    *   The `formatReference` function formats the scripture `reference` by trimming whitespace and prefixing it with an em-dash (U+2014) followed by a space. If the trimmed reference is empty, it returns an empty string.
3.  **Rendering:**
    *   The component renders a `View` as the main container with a specific style (`styles.container`).
    *   A vertical `View` (`styles.bar`) visually separates the quote from the edge of the container.
    *   The formatted `text` and `reference` are rendered inside another `View` (`styles.content`).  Conditional rendering checks `displayText.length` and `displayReference.length` to prevent empty elements (and associated styling) from being rendered if the input strings are empty. This avoids displaying empty quotes or a lone dash on the screen.
    *   The component is made accessible by setting the `accessible` prop to `true`, defining the `accessibilityRole` as "text", and setting a descriptive `accessibilityLabel` based on the verse text and reference.

### 🛡️ Safety & Config
There are no specific RLS or Auth constraints implemented in this component. The component is designed to be a pure presentational element, relying on data passed in as props.  Key configuration is driven by the styling constants (`BAR_WIDTH`, `BORDER_RADIUS`, `CONTENT_PADDING`) and the `Colors` theme.


## 📖 Chapter: SocialPostCard.tsx
**Type:** Component
**Summary:** Renders a single social media post with user information, content, media, and interactive action buttons.

### 🔄 Data Flow
* **Ingress:** The component receives a `post` object (of type `Post` from `@the-way/social-engine`) and several optional props (`isLiked`, `likeCount`, `onLike`, `onPress`, `onComment`, `onRepost`) as input.  The `post` object contains information about the post, including the author, content, media, and any quoted posts.
* **Egress:** The component renders a visual representation of the post.  It also triggers callbacks (`onLike`, `onPress`, `onComment`, `onRepost`) when the corresponding interactive elements are pressed.

### 🧠 Logic
The `SocialPostCard` component primarily focuses on presentation, delegating most data transformation and display logic to pure helper functions. Here's a breakdown:

1.  **Data Resolution:** The component uses several helper functions to extract and format data from the `post` object:
    *   `resolveDisplayName`: Determines the display name of the post author, prioritizing `full_name` over `username`.
    *   `resolveHandle`: Extracts the user's handle (username prefixed with "@").
    *   `resolveAvatarUri`: Resolves the user's avatar URL, using a default avatar if none is provided.
    *   `resolveMediaSlot`: Determines what type of media (video or repost) should be displayed based on the `post` data.  It returns a discriminated union (`MediaSlot`) to represent the media type and its associated data.
    *   `formatLikeCount`: Formats the like count for display.
    *   `resolveLikeColor`: Determines the color of the like icon based on whether the post is liked by the current user.

2.  **Media Rendering:** Based on the `mediaSlot` result, the component renders either a `VideoPreview` (for video posts) or a `VisualRepost` (for quoted posts). If `mediaSlot` is null, no media is rendered.

3.  **Action Handling:** The component provides "Like", "Comment", and "Repost" buttons.  Each button triggers a corresponding callback function (`onLike`, `onComment`, `onRepost`) when pressed. The component updates the "Like" button's icon and text color based on the `isLiked` prop.

4.  **Accessibility:** Each interactive element (the card itself and the action buttons) has `accessibilityRole` and `accessibilityLabel` props set to enhance accessibility for screen reader users.

5.  **Conditional Rendering:** The component conditionally renders elements based on the presence of data. For example, the username is only rendered if it exists.

### 🛡️ Safety & Config
*   There is no explicit Row Level Security (RLS) or authentication logic within this component itself.  It relies on the calling component to provide the necessary security context and handle user interactions.
*   The `DEFAULT_AVATAR` URL provides a fallback in case a user does not have a defined avatar, ensuring consistent rendering.
*   The `INACTIVE_COLOR` constant ensures consistent styling for inactive action icons.
*   The `isLiked` prop defaults to `false`, ensuring a default state for the like button.
---


## 📖 Chapter: SmartFeedList.tsx
**Type:** Component
**Summary:** A performant and offline-friendly social feed list component that supports optimistic like toggling and skeleton loading states.
### 🔄 Data Flow
* **Ingress:**
    * `data`: An array of `Post` objects to be displayed in the feed.
    * `loading`: A boolean indicating whether the feed is currently loading data.
    * `refreshing`: A boolean indicating whether a pull-to-refresh is in progress.
    * `onRefresh`: An optional callback function to be executed when the user performs a pull-to-refresh.
    * `onEndReached`: An optional callback function to be executed when the user reaches the end of the feed.
    * `onPressPost`: An optional callback function to be executed when a post is pressed.
    * `onToggleLike`: An optional callback function that handles the like/unlike action for a post.  It receives the post ID and the desired liked state (boolean) and should return a promise.
* **Egress:**
    * Renders a list of `SocialPostCard` components, each representing a post in the feed.
    * Calls `onRefresh` when the user initiates a pull-to-refresh.
    * Calls `onEndReached` when the user scrolls to the end of the feed.
    * Calls `onPressPost` when a post is pressed.
    * Calls `onToggleLike` when a user likes or unlikes a post.

### 🧠 Logic
1.  **State Management:**
    *   Maintains a local state `optimisticLikes` of type `OptimisticLikesMap` using `useState`. This map stores the optimistic like state for each post, allowing for immediate UI updates before the server responds.

2.  **Optimistic Like Toggling:**
    *   The `handleLike` function is triggered when a user likes or unlikes a post.
    *   It first resolves the current like state using `resolveLikeState`, considering both the server data and any existing optimistic updates.
    *   It then updates the `optimisticLikes` state using `computeOptimisticToggle` to reflect the new like state optimistically.
    *   Finally, it calls the `onToggleLike` prop (the injected side-effect) to persist the like toggle to the backend. If the backend call fails (promise rejection), it reverts the optimistic update by resetting `optimisticLikes` to the previous state (before the toggle).

3.  **Rendering:**
    *   The `renderItem` function renders each post as a `SocialPostCard` component.
    *   It uses `resolveLikeState` to determine the correct like count and liked status for each post, taking into account any optimistic updates.
    *   The `keyExtractor` function extracts the post ID as the key for each item in the `FlashList`.

4.  **Skeleton Loading:**
    *   The `shouldShowSkeleton` function determines whether to display a skeleton loading state. This function considers whether the data is loading, whether a refresh is in progress, and the current length of the data array.
    *   If the skeleton loading state should be displayed, the component renders a series of `PostSkeleton` components.

5.  **List Rendering:**
    *   The component uses `FlashList` for performant list rendering.
    *   It uses the `estimatedItemSize` prop to improve rendering performance.
    *   It uses the `onEndReached` and `onEndReachedThreshold` props to trigger the `onEndReached` callback when the user scrolls to the end of the feed.
    *   It uses the `RefreshControl` component to provide a pull-to-refresh functionality, which triggers the `onRefresh` callback.

### 🛡️ Safety & Config
*   The component relies on the `onToggleLike` prop for handling like/unlike persistence, which should implement necessary authentication and authorization checks.  The component itself is unaware of auth.
*   The `data` prop is expected to be an array of `Post` objects, which should be validated by the calling component/service layer.
*   All props are marked as `readonly` to enforce immutability.
*   The `OptimisticLikesMap` type uses `Readonly<Record<string, OptimisticLikeState>>` to enforce immutability of the optimistic likes map.
*   The `onToggleLike` callback *must* be defined by the caller to ensure the optimistic update is persisted, and to handle any potential errors during persistence (reverting the optimistic update on failure).
---


## 📖 Chapter: PostSkeleton.tsx
**Type:** Component
**Summary:**  A placeholder component that displays a skeleton loading state for a feed post while the actual data is being fetched.

### 🔄 Data Flow
* **Ingress:** None - This component doesn't receive any external data as props. It generates its own data for the skeleton layout.
* **Egress:**  The component renders a visual representation of a skeleton post using `Animated.View` components, creating a pulsing animation effect.

### 🧠 Logic
The component works as follows:

1.  **Animation Configuration:** The `buildPulseSequence` function generates a sequence of opacity values and durations for the pulse animation. It returns a tuple of two `PulseStep` objects, each defining a step in the animation. This configuration is purely data-driven and testable.
2.  **Content Line Configuration:** The `buildContentLines` function generates an array of `SkeletonLine` objects, each describing the width of a content placeholder line in the skeleton. This is also purely data-driven, allowing easy modification of the layout.
3.  **Animation Hook:** The `usePulseAnimation` hook takes an `Animated.Value` and a `PulseStep` sequence as input. It uses the `Animated` API to create a looping animation that changes the opacity of the animated value according to the sequence. The hook encapsulates the imperative animation logic, making the component cleaner.
4.  **Component Rendering:** The `PostSkeleton` component uses the `useRef` hook to create and persist the animation value, pulse sequence, and content lines. It then uses the `usePulseAnimation` hook to start the animation. Finally, it renders a series of `Animated.View` components, applying the animated opacity to create the pulse effect on the skeleton's avatar, text lines, and action placeholders. The number of action placeholders is determined by the `ACTION_PLACEHOLDER_COUNT` constant.

### 🛡️ Safety & Config
There are no specific RLS or Auth constraints related to this component, as it only deals with UI presentation and does not interact with any backend data or user authentication. The animation parameters and layout configurations are defined by constants and pure functions. No external configuration or data is passed to the component.
---


