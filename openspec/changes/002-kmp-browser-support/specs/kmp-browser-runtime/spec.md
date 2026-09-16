## Purpose

State what the shared Kotlin Multiplatform libraries owe a consumer that runs
them in a browser rather than in Node — so that an IDE's web host, a website and
a documentation site can all use the same language stack without each
rediscovering which artifact reaches for a filesystem.

## ADDED Requirements

### Requirement: The published JS artifacts run in a browser
Every Kotlin Multiplatform library published for JS consumption SHALL load and
operate in a browser and in a Web Worker, with no Node runtime present. This
SHALL hold for every library a consumer reaches, including ones it reaches only
through another library.

#### Scenario: Loading the language stack in a Web Worker
- **GIVEN** a consumer bundling the language stack for a Web Worker
- **WHEN** the worker starts and the modules are loaded
- **THEN** they load and the stack is usable, without a Node runtime

#### Scenario: A capability nobody calls
- **GIVEN** a library containing functionality that only makes sense on a server
- **WHEN** a browser consumer loads that library without using that functionality
- **THEN** loading succeeds

#### Scenario: A library reached only indirectly
- **GIVEN** a consumer that uses a high-level library which depends on several
  others
- **WHEN** it runs in a browser
- **THEN** every library in that chain works there, because one that does not
  makes all of them unusable

**Rationale:** the second scenario is the one that bites. A platform-only
dependency declared at module level is resolved when the module graph loads, not
when the code is called — so an unused capability is enough to stop a consumer
from starting at all, and it fails inside a worker where diagnosis is hardest.

### Requirement: Libraries take the means of reading content from their caller
A library that reads content SHALL accept the means of reading it from whoever
calls it, and SHALL NOT require a particular platform's way of reaching storage
or the network. A default suited to one platform MAY be offered, provided a
consumer can replace it and does not pay for it by loading the library.

#### Scenario: Reading in a browser
- **GIVEN** a browser consumer whose content is reachable only through the
  embedding application
- **WHEN** it supplies its own way of reading content
- **THEN** the library uses it, and never attempts to reach storage itself

#### Scenario: Reading on a server
- **GIVEN** a consumer running with a filesystem available
- **WHEN** it uses the library without supplying anything
- **THEN** a sensible default is available to it

#### Scenario: Not paying for the default
- **GIVEN** a browser consumer that supplies its own way of reading content
- **WHEN** the library is loaded
- **THEN** nothing that only a server could satisfy is required in order to load
  it

### Requirement: A capability that is unavailable on a platform says so
Where a library offers something that cannot work on the platform it is running
on, it SHALL report that it is unavailable rather than failing in a way a
consumer cannot distinguish from a defect, and a consumer SHALL be able to find
out before depending on it.

#### Scenario: Something that needs a platform facility
- **GIVEN** a library capability that depends on a facility a browser does not
  have
- **WHEN** a browser consumer reaches it
- **THEN** it is told the capability is unavailable here, rather than receiving
  an error that reads like a bug

#### Scenario: Deciding what to offer a user
- **GIVEN** a consumer deciding which features to present
- **WHEN** it asks what is available on this platform
- **THEN** it can find out without triggering a failure to ask

### Requirement: Browser usability is verified where the artifact is produced
Each repository publishing a JS artifact SHALL verify that it loads and works in
a browser as part of its own build, so that a regression fails there rather than
in a consumer.

#### Scenario: Someone adds a platform-only dependency
- **GIVEN** a contributor who introduces a Node-only dependency into a shared
  library
- **WHEN** that repository's build runs
- **THEN** it fails, naming the problem, before the artifact is published

#### Scenario: A consumer upgrading a version
- **GIVEN** a consumer taking a new version of a shared library
- **WHEN** it bundles it for a browser
- **THEN** it can rely on this having been checked upstream, rather than being
  the one who discovers it

**Rationale:** without this, the only test of browser safety is a user opening a
web IDE, and the only symptom is a worker that fails to start. The property has
to be checked by whoever can still cheaply fix it.


### Requirement: The JS language server provides runnable message endpoints
The published JS language server SHALL provide entry points that accept and
answer Language Server Protocol messages over Node child-process IPC and Web
Worker messaging, respectively. A consumer SHALL be able to initialise the
server, discover its advertised language and custom-request capabilities, and
use those capabilities without supplying its own language-server implementation.

#### Scenario: A desktop consumer starts the shipped JS server
- **GIVEN** a consumer with the published JS server available
- **WHEN** it starts the server in a Node child process and initialises over IPC
- **THEN** the server answers initialisation and subsequent supported requests
  through that connection

#### Scenario: A browser consumer starts the shipped JS server
- **GIVEN** a consumer with the published JS server available and no Node runtime
- **WHEN** it starts the server in a Web Worker and initialises through messaging
- **THEN** the server answers initialisation and subsequent supported requests
  through that connection without requiring Node APIs
