using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using RimWorld.IO;
using RuntimeAudioClipLoader;
using UnityEngine;

namespace Verse;

public static class ModContentLoader<T> where T : class
{
	private static string[] AcceptableExtensionsAudio = new string[7] { ".wav", ".mp3", ".ogg", ".xm", ".it", ".mod", ".s3m" };

	private static string[] AcceptableExtensionsTexture = new string[5] { ".png", ".jpg", ".jpeg", ".psd", ".dds" };

	private static string[] AcceptableExtensionsString = new string[1] { ".txt" };

	public static bool IsAcceptableExtension(string extension)
	{
		string[] array;
		if (typeof(T) == typeof(AudioClip))
		{
			array = AcceptableExtensionsAudio;
		}
		else if (typeof(T) == typeof(Texture2D))
		{
			array = AcceptableExtensionsTexture;
		}
		else
		{
			if (!(typeof(T) == typeof(string)))
			{
				Log.Error("Unknown content type " + typeof(T));
				return false;
			}
			array = AcceptableExtensionsString;
		}
		string[] array2 = array;
		foreach (string text in array2)
		{
			if (extension.ToLower() == text)
			{
				return true;
			}
		}
		return false;
	}

	public static IEnumerable<Pair<string, LoadedContentItem<T>>> LoadAllForMod(ModContentPack mod)
	{
		DeepProfiler.Start("Loading assets of type " + typeof(T)?.ToString() + " for mod " + mod);
		Dictionary<string, FileInfo> allFilesForMod = ModContentPack.GetAllFilesForMod(mod, GenFilePaths.ContentPath<T>(), IsAcceptableExtension);
		HashSet<string> ddsFiles = (from k in allFilesForMod.Keys
			select k.ToLowerInvariant() into k
			where k.EndsWith(".dds")
			select k).ToHashSet();
		foreach (KeyValuePair<string, FileInfo> item in allFilesForMod)
		{
			item.Deconstruct(out var key, out var value);
			string text = key;
			FileInfo fileInfo = value;
			if (typeof(T) == typeof(Texture2D) && text.Length > 4)
			{
				int length = text.Length;
				int num = length - 4;
				if (!text.Substring(num, length - num).Equals(".dds", StringComparison.OrdinalIgnoreCase))
				{
					key = text.ToLowerInvariant();
					if (ddsFiles.Contains(key.Substring(0, key.Length - 4) + ".dds"))
					{
						continue;
					}
				}
			}
			LoadedContentItem<T> loadedContentItem = LoadItem((FilesystemFile)fileInfo);
			if (loadedContentItem != null)
			{
				yield return new Pair<string, LoadedContentItem<T>>(text, loadedContentItem);
			}
		}
		DeepProfiler.End();
	}

	public static LoadedContentItem<T> LoadItem(VirtualFile file)
	{
		try
		{
			if (typeof(T) == typeof(string))
			{
				return new LoadedContentItem<T>(file, (T)(object)file.ReadAllText());
			}
			if (typeof(T) == typeof(Texture2D))
			{
				return new LoadedContentItem<T>(file, (T)(object)LoadTexture(file));
			}
			if (typeof(T) == typeof(AudioClip))
			{
				IDisposable disposable = null;
				bool doStream = ShouldStreamAudioClipFromFile(file);
				Stream stream = file.CreateReadStream();
				T val;
				try
				{
					val = (T)(object)Manager.Load(stream, GetFormat(file.Name), file.Name, doStream);
				}
				catch (Exception)
				{
					stream.Dispose();
					throw;
				}
				disposable = stream;
				UnityEngine.Object obj = val as UnityEngine.Object;
				if (obj != null)
				{
					obj.name = Path.GetFileNameWithoutExtension(file.Name);
				}
				return new LoadedContentItem<T>(file, val, disposable);
			}
		}
		catch (Exception arg)
		{
			Log.Error($"Exception loading {typeof(T)} from file.\nabsFilePath: {file.FullPath}\nException: {arg}");
		}
		if (typeof(T) == typeof(Texture2D))
		{
			return (LoadedContentItem<T>)(object)new LoadedContentItem<Texture2D>(file, BaseContent.BadTex);
		}
		return null;
	}

	private static AudioFormat GetFormat(string filename)
	{
		switch (Path.GetExtension(filename))
		{
		case ".ogg":
			return AudioFormat.ogg;
		case ".mp3":
			return AudioFormat.mp3;
		case ".aiff":
		case ".aif":
		case ".aifc":
			return AudioFormat.aiff;
		case ".wav":
			return AudioFormat.wav;
		default:
			return AudioFormat.unknown;
		}
	}

	private static AudioType GetAudioTypeFromURI(string uri)
	{
		if (uri.EndsWith(".ogg"))
		{
			return AudioType.OGGVORBIS;
		}
		return AudioType.WAV;
	}

	private static bool ShouldStreamAudioClipFromFile(VirtualFile file)
	{
		if (!(file is FilesystemFile) || !file.Exists)
		{
			return false;
		}
		return file.Length > 307200;
	}

	private static Texture2D LoadTexture(VirtualFile file)
	{
		if (!file.Exists)
		{
			return null;
		}
		if (file.Name.EndsWith(".dds", StringComparison.OrdinalIgnoreCase))
		{
			return ModDdsLoader.TryLoadDds(file);
		}
		Texture2D texture2D = LoadTextureViaImageConversion(file);
		texture2D.name = Path.GetFileNameWithoutExtension(file.Name);
		return texture2D;
	}

	private static Texture2D LoadTextureViaImageConversion(VirtualFile file)
	{
		byte[] data = file.ReadAllBytes();
		Texture2D texture2D = new Texture2D(2, 2, TextureFormat.Alpha8, mipChain: true);
		texture2D.LoadImage(data);
		if ((texture2D.width < 4 || texture2D.height < 4 || !Mathf.IsPowerOfTwo(texture2D.width) || !Mathf.IsPowerOfTwo(texture2D.height)) && Prefs.TextureCompression)
		{
			int num = StaticTextureAtlas.CalculateMaxMipmapsForDxtSupport(texture2D);
			if (Prefs.LogVerbose)
			{
				Log.Warning($"Texture {file.Name} is being reloaded with reduced mipmap count (clamped to {num}) due to non-power-of-two dimensions: ({texture2D.width}x{texture2D.height}). This will be slower to load, and will look worse when zoomed out. Consider using a power-of-two texture size instead.");
			}
			if (!UnityData.ComputeShadersSupported)
			{
				Texture2D texture2D2 = new Texture2D(texture2D.width, texture2D.height, TextureFormat.Alpha8, num, linear: false);
				UnityEngine.Object.DestroyImmediate(texture2D);
				texture2D = texture2D2;
				texture2D.LoadImage(data);
			}
		}
		bool flag = texture2D.width % 4 == 0 && texture2D.height % 4 == 0;
		if (Prefs.TextureCompression && flag)
		{
			if (!UnityData.ComputeShadersSupported)
			{
				texture2D.Compress(highQuality: true);
				texture2D.filterMode = FilterMode.Trilinear;
				texture2D.anisoLevel = 2;
				texture2D.Apply(updateMipmaps: true, makeNoLongerReadable: true);
			}
			else
			{
				texture2D.filterMode = FilterMode.Trilinear;
				texture2D.anisoLevel = 2;
				texture2D.Apply(updateMipmaps: true, makeNoLongerReadable: true);
				texture2D = StaticTextureAtlas.FastCompressDXT(texture2D, deleteOriginal: true);
			}
		}
		else
		{
			texture2D.filterMode = FilterMode.Trilinear;
			texture2D.anisoLevel = 2;
			texture2D.Apply(updateMipmaps: true, makeNoLongerReadable: true);
		}
		return texture2D;
	}
}
