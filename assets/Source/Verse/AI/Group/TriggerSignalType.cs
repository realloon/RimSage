namespace Verse.AI.Group;

public enum TriggerSignalType : byte
{
	Undefined = 0,
	Tick = 1,
	Memo = 2,
	PawnDamaged = 3,
	PawnArrestAttempted = 4,
	PawnLost = 5,
	BuildingDamaged = 6,
	BuildingLost = 7,
	FactionRelationsChanged = 8,
	DormancyWakeup = 9,
	Clamor = 10,
	MechClusterDefeated = 11,
	Signal = 12,
	CorpseLost = 13,
	AcquiredTarget = 14
}
