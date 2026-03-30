"use client";
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw, ZoomIn, ZoomOut, RectangleHorizontal, Square, Circle } from 'lucide-react';
import styles from './style.module.scss';

/**
 * Reusable Image Crop Modal
 * Props:
 *   imageSrc - base64 or object URL of the image to crop
 *   onCropComplete - callback(croppedBlob, croppedUrl)
 *   onClose - close the modal
 *   aspectRatio - number or undefined for free crop. Defaults to undefined (free).
 *   cropShape - 'rect' or 'round'
 */
export default function ImageCropModal({
    imageSrc,
    onCropComplete,
    onClose,
    aspectRatio,
    cropShape = 'rect'
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [currentAspect, setCurrentAspect] = useState(aspectRatio || undefined);

    const onCropChange = useCallback((crop) => setCrop(crop), []);
    const onZoomChange = useCallback((zoom) => setZoom(zoom), []);

    const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            const croppedUrl = URL.createObjectURL(croppedBlob);
            onCropComplete(croppedBlob, croppedUrl);
        } catch (e) {
            console.error('Crop failed:', e);
        }
    }, [croppedAreaPixels, imageSrc, rotation, onCropComplete]);

    // Aspect ratio presets (only shown when no fixed aspect was passed)
    const showAspectPresets = !aspectRatio;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Şəkli kəs</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.cropContainer}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={currentAspect}
                        cropShape={cropShape}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={handleCropComplete}
                    />
                </div>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} title="Zoom out">
                            <ZoomOut size={18} />
                        </button>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} title="Zoom in">
                            <ZoomIn size={18} />
                        </button>
                    </div>

                    <div className={styles.controlGroup}>
                        <button onClick={() => setRotation(r => (r + 90) % 360)} title="Fırlat">
                            <RotateCw size={18} />
                        </button>
                    </div>

                    {showAspectPresets && (
                        <div className={styles.controlGroup}>
                            <button
                                onClick={() => setCurrentAspect(undefined)}
                                title="Sərbəst"
                                className={!currentAspect ? styles.activeControl : ''}
                            >
                                <RectangleHorizontal size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentAspect(1)}
                                title="1:1"
                                className={currentAspect === 1 ? styles.activeControl : ''}
                            >
                                <Square size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentAspect(16 / 9)}
                                title="16:9"
                                className={currentAspect === 16/9 ? styles.activeControl : ''}
                            >
                                16:9
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Ləğv et
                    </button>
                    <button className={styles.confirmBtn} onClick={handleConfirm}>
                        <Check size={16} />
                        Təsdiqlə
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Canvas-based crop helper ───────────────────────────────────────────────

function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.crossOrigin = 'anonymous';
        image.src = url;
    });
}

function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
}
