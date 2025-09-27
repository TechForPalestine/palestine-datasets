// @ts-expect-error -- img imports untyped but work fine
import listViewerScreenshot from "../../static/img/list-viewer.png";

export const ListViewerImgButton = () => {
  return (
    <a href="/list" title="View names list in web viewer">
      <div
        style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}
      >
        <img
          src={listViewerScreenshot}
          style={{
            maxWidth: "100%",
          }}
          alt="List Viewer Screenshot Thumbnail"
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(20, 20, 20, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: "1.3em",
              backgroundColor: "rgba(100, 100, 100, 0.6)",
              padding: 20,
              borderRadius: 20,
            }}
          >
            Names list web viewer →
          </span>
        </div>
      </div>
    </a>
  );
};
