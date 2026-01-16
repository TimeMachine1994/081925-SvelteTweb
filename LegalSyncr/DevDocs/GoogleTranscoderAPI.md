Transcoder API

This API converts video files into formats suitable for consumer distribution. For more information, see the Transcoder API overview.

Service: transcoder.googleapis.com
To call this service, we recommend that you use the Google-provided client libraries. If your application needs to use your own libraries to call this service, use the following information when you make the API requests.

Discovery document
A Discovery Document is a machine-readable specification for describing and consuming REST APIs. It is used to build client libraries, IDE plugins, and other tools that interact with Google APIs. One service may provide multiple discovery documents. This service provides the following discovery document:

https://transcoder.googleapis.com/$discovery/rest?version=v1
Service endpoint
A service endpoint is a base URL that specifies the network address of an API service. One service might have multiple service endpoints. This service has the following service endpoint and all URIs below are relative to this service endpoint:

https://transcoder.googleapis.com
REST Resource: v1.projects.locations.jobTemplates
Methods
create	POST /v1/{parent=projects/*/locations/*}/jobTemplates
Creates a job template in the specified region.
delete	DELETE /v1/{name=projects/*/locations/*/jobTemplates/*}
Deletes a job template.
get	GET /v1/{name=projects/*/locations/*/jobTemplates/*}
Returns the job template data.
list	GET /v1/{parent=projects/*/locations/*}/jobTemplates
Lists job templates in the specified region.
REST Resource: v1.projects.locations.jobs
Methods
create	POST /v1/{parent=projects/*/locations/*}/jobs
Creates a job in the specified region.
delete	DELETE /v1/{name=projects/*/locations/*/jobs/*}
Deletes a job.
get	GET /v1/{name=projects/*/locations/*/jobs/*}
Returns the job data.
list	GET /v1/{parent=projects/*/locations/*}/jobs
Lists jobs in the specified region.