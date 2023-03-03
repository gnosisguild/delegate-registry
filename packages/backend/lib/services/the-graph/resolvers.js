// import { Resolvers } from "./.graphclient"

module.exports.resolvers = {
  //: Resolvers = {
  Context: {
    // chainName can exist already in root as we pass it in the other resolver
    chainName: (root, args, meshContext, info) =>
      root.chainName || meshContext.chainName || "gorli", // The value we provide in the config
  },
  Query: {
    crossContext: async (root, args, meshContext, info) =>
      Promise.all(
        args.chainNames.map((chainName) =>
          meshContext.DelegateRegistry.Query.context({
            root,
            args: {
              id: args.contextId,
            },
            context: {
              ...meshContext,
              chainName,
            },
            info,
          }).then((contextRes) => {
            if (contextRes == null) return undefined
            // We send chainName here so we can take it in the resolver above
            return { ...contextRes, chainName }
          }),
        ),
      ).then((allContexts) => allContexts.filter((_) => _ != null).flat()),
    crossContexts: async (root, args, meshContext, info) =>
      Promise.all(
        args.chainNames.map((chainName) =>
          meshContext.DelegateRegistry.Query.contexts({
            root,
            args,
            context: {
              ...meshContext,
              chainName,
            },
            info,
          }).then((contextsRes) => {
            // We send chainName here so we can take it in the resolver above
            return contextsRes.map((contextRes) => ({
              ...contextRes,
              chainName,
            }))
          }),
        ),
      ).then((allContexts) => allContexts.flat()),
  },
}