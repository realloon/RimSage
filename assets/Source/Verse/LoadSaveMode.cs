namespace Verse;

public enum LoadSaveMode : byte
{
	Inactive = 0,
	Saving = 1,
	LoadingVars = 2,
	ResolvingCrossRefs = 3,
	PostLoadInit = 4
}
