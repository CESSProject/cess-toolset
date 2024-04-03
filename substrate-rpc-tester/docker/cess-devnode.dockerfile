# docker push to:
#   https://hub.docker.com/r/hkwtf/cess-devnode/tags
FROM cesslab/cess-chain:testnet
EXPOSE 9944
RUN echo "$PWD/cess-node --dev --rpc-methods unsafe --rpc-external" > /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/usr/bin/bash", "-c", "/entrypoint.sh"]
