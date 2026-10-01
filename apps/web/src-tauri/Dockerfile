# Toolchain image for building the adda desktop app (Tauri v2) on Linux.
# Used by the compose `desktop` service; produces .deb/.AppImage installers.
# macOS/Windows installers must be built natively (see AGENTS.md).
FROM node:26-bookworm

# Tauri v2 system dependencies (WebKitGTK + bundler extras).
RUN apt-get update && apt-get install -y --no-install-recommends \
      libwebkit2gtk-4.1-dev \
      libgtk-3-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      patchelf \
      file \
      libssl-dev \
      libfuse2 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

ENV CARGO_HOME=/usr/local/cargo
ENV RUSTUP_HOME=/usr/local/rustup
ENV PATH="/usr/local/cargo/bin:${PATH}"
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal

WORKDIR /app
