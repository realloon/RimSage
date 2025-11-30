namespace Verse;

public enum TraverseMode : byte
{
	ByPawn = 0,
	PassDoors = 1,
	NoPassClosedDoors = 2,
	PassAllDestroyableThings = 3,
	PassAllDestroyablePlayerOwnedThings = 4,
	NoPassClosedDoorsOrWater = 5,
	PassAllDestroyableThingsNotWater = 6
}
