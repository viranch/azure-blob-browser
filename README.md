# azure-blob-browser

Static HTML app to host an [Apaxy](https://oupala.github.io/apaxy/)-themed Azure Blob Storage browser

## Requirements

* Azure Storage Account with blob containers with public access enabled

## Setup

* Enable public access on desired data blob container
* Create an "apps" container (in the same storage account as the data container) to hold the static files, store its SAS URL in `${SAS_URL_FOR_YOUR_APPS_CONTAINER}` and enable public access
* Upload static HTML files to the apps container:
```bash
git clone git://github.com/viranch/azure-blob-indexer/ /tmp/
ln -s /tmp/azure-blob-indexer /tmp/list
cd /tmp/list
AZCOPY_CRED_TYPE=Anonymous azcopy copy "$(pwd)" "${SAS_URL_FOR_YOUR_APPS_CONTAINER}" --from-to=LocalBlob --blob-type Detect --follow-symlinks --put-md5 --follow-symlinks --recursive
```

## Usage

Navigate to `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${APPS_CONTAINER_NAME}/list/index.html#/${DATA_CONTAINER_NAME}` after replacing every `${..}` with appropriate values in your web browser.

## Report issues

Open an issue on this repository to report any problems.
