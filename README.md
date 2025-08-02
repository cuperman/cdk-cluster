# cdk-cluster

CDK Constructs to simplify running containers in an ECS Cluster.  Optimized for web apps built with popular frameworks, such as:

- Ruby on Rails
- Django
- Next.js

## Useful commands

* `yarn build`           compile typescript to js
* `yarn build --watch`   watch for changes and compile
* `yarn test`            perform the jest unit tests
* `yarn test --watch`    watch for changes and run tests

## Release workflow

```bash
# Bump version with yarn
yarn version --patch # or --minor, --major

# Push commits and tags
git push && git push --tags
```

Then create a [Github Release](https://github.com/cuperman/cdk-cluster/releases) and it will trigger the publish workflow
