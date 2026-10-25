"""Sniff an uploaded image from its bytes: format and pixel size, never from the file name."""

import struct
from dataclasses import dataclass


@dataclass(frozen=True)
class ImageInfo:
    ext: str  # "png", "gif", "webp" or "jpg"
    media_type: str
    width: int
    height: int


def _png(data: bytes) -> ImageInfo | None:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or len(data) < 24:
        return None
    width, height = struct.unpack(">II", data[16:24])
    return ImageInfo("png", "image/png", width, height)


def _gif(data: bytes) -> ImageInfo | None:
    if data[:6] not in (b"GIF87a", b"GIF89a") or len(data) < 10:
        return None
    width, height = struct.unpack("<HH", data[6:10])
    return ImageInfo("gif", "image/gif", width, height)


def _webp(data: bytes) -> ImageInfo | None:
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP" or len(data) < 30:
        return None
    kind = data[12:16]
    if kind == b"VP8 ":
        width, height = struct.unpack("<HH", data[26:30])
        return ImageInfo("webp", "image/webp", width & 0x3FFF, height & 0x3FFF)
    if kind == b"VP8L":
        b0, b1, b2, b3 = data[21:25]
        width = 1 + (((b1 & 0x3F) << 8) | b0)
        height = 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
        return ImageInfo("webp", "image/webp", width, height)
    if kind == b"VP8X":
        width = 1 + int.from_bytes(data[24:27], "little")
        height = 1 + int.from_bytes(data[27:30], "little")
        return ImageInfo("webp", "image/webp", width, height)
    return None


def _jpeg(data: bytes) -> ImageInfo | None:
    if data[:3] != b"\xff\xd8\xff":
        return None
    i = 2
    while i + 9 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        (length,) = struct.unpack(">H", data[i + 2 : i + 4])
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            height, width = struct.unpack(">HH", data[i + 5 : i + 9])
            return ImageInfo("jpg", "image/jpeg", width, height)
        i += 2 + length
    return None


def sniff_image(data: bytes) -> ImageInfo | None:
    """The image's real format and size, or None if the bytes are not a PNG, GIF, WebP or JPEG."""
    for reader in (_png, _gif, _webp, _jpeg):
        info = reader(data)
        if info is not None and info.width > 0 and info.height > 0:
            return info
    return None
