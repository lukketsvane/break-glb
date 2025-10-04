import React from "react"

// ============================================================================
// Loading Component
// ============================================================================

interface LoadingProps {
  progress?: number
  message?: string
}

export function LoadingFallback({ progress, message }: LoadingProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          border: "3px solid rgba(255, 255, 255, 0.1)",
          borderTop: "3px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      {message && (
        <p style={{ marginTop: 20, fontSize: 14, opacity: 0.8 }}>{message}</p>
      )}
      {progress !== undefined && (
        <div style={{ marginTop: 15, width: 200 }}>
          <div
            style={{
              width: "100%",
              height: 4,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "white",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6, textAlign: "center" }}>
            {Math.round(progress)}%
          </p>
        </div>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

// ============================================================================
// Error Component
// ============================================================================

interface ErrorDisplayProps {
  error: Error
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 20,
        zIndex: 1000,
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ marginBottom: 20, color: "#ef4444" }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600 }}>
        Failed to Load Model
      </h3>

      <p
        style={{
          margin: 0,
          marginBottom: 20,
          fontSize: 14,
          opacity: 0.7,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {error.message || "An unexpected error occurred while loading the 3D model."}
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6"
            }}
          >
            Try Again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Upload Zone Component
// ============================================================================

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isDragging: boolean
}

export function UploadZone({ onFileSelect, isDragging }: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background-color 0.2s",
        backgroundColor: isDragging ? "rgba(255, 255, 255, 0.05)" : "transparent",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".glb"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{
          marginBottom: 20,
          color: "rgba(255, 255, 255, 0.5)",
          transition: "transform 0.2s",
          transform: isDragging ? "scale(1.1)" : "scale(1)",
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <h3
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 20,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.9)",
        }}
      >
        {isDragging ? "Drop to Upload" : "Upload 3D Model"}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {isDragging ? "Release to load" : "Click or drag GLB file here"}
      </p>
    </div>
  )
}

// ============================================================================
// Control Panel Component
// ============================================================================

interface ControlPanelProps {
  isExploded: boolean
  onExplode: () => void
  onUpload?: () => void
  showUploadButton: boolean
}

export function ControlPanel({
  isExploded,
  onExplode,
  onUpload,
  showUploadButton,
}: ControlPanelProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 9999,
          padding: "8px 16px",
        }}
      >
        {showUploadButton && onUpload && (
          <>
            <button
              onClick={onUpload}
              title="Upload new model"
              style={{
                padding: 8,
                backgroundColor: "transparent",
                border: "none",
                borderRadius: 9999,
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </button>
            <div style={{ width: 1, height: 24, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
          </>
        )}

        <button
          onClick={onExplode}
          title={isExploded ? "Assemble" : "Explode"}
          style={{
            padding: 8,
            backgroundColor: isExploded ? "rgba(255, 255, 255, 0.2)" : "transparent",
            border: "none",
            borderRadius: 9999,
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isExploded) {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
            }
          }}
          onMouseLeave={(e) => {
            if (!isExploded) {
              e.currentTarget.style.backgroundColor = "transparent"
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
