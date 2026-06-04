ARG VARIANT=22-bookworm
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:${VARIANT}

ADD https://github.com/plantuml/plantuml/releases/download/v1.2025.4/plantuml-1.2025.4.jar /usr/local/

RUN apt-get update \
    && apt-get install -y graphviz graphviz-dev pkg-config \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/* \
    && chmod 644 /usr/local/plantuml-1.2025.4.jar
