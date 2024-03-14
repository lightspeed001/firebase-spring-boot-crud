# CI/CD Demo with Tekton and Argo CD on OpenShift

This repo is a CI/CD demo using [Tekton Pipelines](http://www.tekton.dev) for continuous integration and [Argo CD](https://argoproj.github.io/argo-cd/) for continuous delivery on OpenShift which builds and deploys the [Spring PetClinic](https://github.com/spring-projects/firebase-spring-boot-crud) sample Spring Boot application. This demo creates:

* 3 namespaces for CI/CD, DEV, STAGE AND PROD projects
* 1 Tekton pipeline for building the application image on every Git commit and pull-request
* Argo CD (login with OpenShift credentials)
* Gitea git server (username/password: `gitea`/`openshift`)
* Sonatype Nexus (username/password: `admin`/`admin123`)
* SonarQube (username/password: `admin`/`admin`)

<p align="center">
  <img width="580" src="docs/images/projects.svg">
</p>

## Prerequisites

* OpenShift GitOps 1.8
* OpenShift Pipelines 1.10

## Continuous Integration

On every push or pull-request to the `firebase-spring-boot-crud` git repository on Gitea git server, the following steps are executed within the Tekton pipeline:

1. Code is cloned from Gitea git server and the unit-tests are run
1. Unit tests are executed and in parallel the code is analyzed by SonarQube for anti-patterns, and a dependency report is generated
1. Application is packaged as a JAR and released to Sonatype Nexus snapshot repository
1. A container image is built in DEV environment using S2I, and pushed to OpenShift internal registry, and tagged with `firebase-spring-boot-crud:[branch]-[commit-sha]` and `firebase-spring-boot-crud:latest`
1. Kubernetes manifests are updated in the Git repository with the image digest that was built within the pipeline
1. A pull-requested is created on config repo for merging the image digest update into the STAGE environment

![Pipeline Diagram](docs/images/ci-pipeline.svg)

## Continuous Delivery

Argo CD continuously monitor the configurations stored in the Git repository and uses [Kustomize](https://kustomize.io/) to overlay environment specific configurations when deploying the application to DEV and STAGE environments.

![Continuous Delivery](docs/images/cd.png)

## Install Demo

1. Get an OpenShift cluster via https://try.openshift.com
1. Install OpenShift Pipelines and OpenShift GitOps operators 
1. Download [OpenShift CLI](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/) and [OpenShift Pipelines CLI](https://mirror.openshift.com/pub/openshift-v4/clients/pipeline/latest/)
1. Run the install script

    ```text
    $ oc new-project demo
    $ git clone https://github.com/lightspeed001/firebase-spring-boot-crud
    $ demo.sh install
    ```

## Demo Instructions

1. Go to firebase-spring-boot-crud Git repository in Gitea
1. Log into Gitea with username/password: `gitea`/`openshift`
1. Edit a file in the repository and commit to trigger the pipeline. Alternatively, create a pull-request instead to see the result on the deployed app before merging.
1. Check the pipeline run logs in Dev Console or Tekton CLI:

   ```text
   $ opc pac logs -n demo-cicd
   ```

1. Once the pipeline finishes successfully, the image reference in the `firebase-spring-boot-crud-config/environments/dev` are updated with the new image digest and automatically deployed to the DEV environment by Argo CD. If Argo CD hasn't polled the Git repo for changes yet, click on the "Refresh" button on the Argo CD application.

1. Login into Argo CD dashboard and check the sync history of `dev-firebase-spring-boot-crud` application to verify the recent deployment

1. Go to the pull requests tab on `firebase-spring-boot-crud-config` Git repository in Gitea and merge the pull-requested that is generated for promotion from DEV to STAGE

1. Check the sync history of `stage-firebase-spring-boot-crud` application in Argo CD dashboard to verify the recent deployment to the staging environment. If Argo CD hasn't polled the Git repo for changes yet, click on the "Refresh" button on the Argo CD application.

