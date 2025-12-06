namespace Ionic.Zlib;

internal enum BlockState
{
	NeedMore = 0,
	BlockDone = 1,
	FinishStarted = 2,
	FinishDone = 3
}
