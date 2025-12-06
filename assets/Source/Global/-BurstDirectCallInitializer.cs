using RimWorld;
using RimWorld.Planet;
using UnityEngine;

internal static class _0024BurstDirectCallInitializer
{
	[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterAssembliesLoaded)]
	private static void Initialize()
	{
		MapGenUtility.ComputeLargestRects_0000B73F_0024BurstDirectCall.Initialize();
		MapGenUtility.RectsComputeSpaces_0000B740_0024BurstDirectCall.Initialize();
		FastTileFinder.Initialize_0024ComputeQueryJob_SphericalDistance_00014F20_0024BurstDirectCall();
		PlanetLayer.CalculateAverageTileSize_000153E3_0024BurstDirectCall.Initialize();
		PlanetLayer.IntGetTileSize_000153E5_0024BurstDirectCall.Initialize();
		PlanetLayer.IntGetTileCenter_000153E8_0024BurstDirectCall.Initialize();
	}
}
