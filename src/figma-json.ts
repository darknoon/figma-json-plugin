// Based on: Figma Plugin API version 1, update 5

////////////////////////////////////////////////////////////////////////////////
// Dump that includes nodes and images

export type Base64String = string;

export interface DumpedFigma {
  objects: SceneNode[];
  images: { [hash: string]: Base64String };
}

////////////////////////////////////////////////////////////////////////////////
// Datatypes

type Mixed = "__Symbol(figma.mixed)__";

export type Transform = [[number, number, number], [number, number, number]];

export interface Vector {
  readonly x: number;
  readonly y: number;
}

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface FontName {
  readonly family: string;
  readonly style: string;
}

export type TextCase = "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";

export type TextDecoration = "NONE" | "UNDERLINE" | "STRIKETHROUGH";

export interface ArcData {
  readonly startingAngle: number;
  readonly endingAngle: number;
  readonly innerRadius: number;
}

export interface ShadowEffect {
  readonly type: "DROP_SHADOW" | "INNER_SHADOW";
  readonly color: RGBA;
  readonly offset: Vector;
  readonly radius: number;
  readonly visible: boolean;
  readonly blendMode: BlendMode;
}

export interface BlurEffect {
  readonly type: "LAYER_BLUR" | "BACKGROUND_BLUR";
  readonly radius: number;
  readonly visible: boolean;
}

export type Effect = ShadowEffect | BlurEffect;

export type ConstraintType = "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";

export interface Constraints {
  readonly horizontal: ConstraintType;
  readonly vertical: ConstraintType;
}

export interface ColorStop {
  readonly position: number;
  readonly color: RGBA;
}

export interface ImageFilters {
  readonly exposure?: number;
  readonly contrast?: number;
  readonly saturation?: number;
  readonly temperature?: number;
  readonly tint?: number;
  readonly highlights?: number;
  readonly shadows?: number;
}

export interface SolidPaint {
  readonly type: "SOLID";
  readonly color: RGB;

  readonly visible?: boolean;
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
}

export interface GradientPaint {
  readonly type:
    | "GRADIENT_LINEAR"
    | "GRADIENT_RADIAL"
    | "GRADIENT_ANGULAR"
    | "GRADIENT_DIAMOND";
  readonly gradientTransform: Transform;
  readonly gradientStops: ReadonlyArray<ColorStop>;

  readonly visible?: boolean;
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
}

export interface ImagePaint {
  readonly type: "IMAGE";
  readonly scaleMode: "FILL" | "FIT" | "CROP" | "TILE";
  readonly imageHash: string | null;
  readonly imageTransform?: Transform; // setting for "CROP"
  readonly scalingFactor?: number; // setting for "TILE"
  readonly filters?: ImageFilters;

  readonly visible?: boolean;
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
}

export type Paint = SolidPaint | GradientPaint | ImagePaint;

export interface Guide {
  readonly axis: "X" | "Y";
  readonly offset: number;
}

export interface RowsColsLayoutGrid {
  readonly pattern: "ROWS" | "COLUMNS";
  readonly alignment: "MIN" | "MAX" | "STRETCH" | "CENTER";
  readonly gutterSize: number;

  readonly count: number; // Infinity when "Auto" is set in the UI
  readonly sectionSize?: number; // Not set for alignment: "STRETCH"
  readonly offset?: number; // Not set for alignment: "CENTER"

  readonly visible?: boolean;
  readonly color?: RGBA;
}

export interface GridLayoutGrid {
  readonly pattern: "GRID";
  readonly sectionSize: number;

  readonly visible?: boolean;
  readonly color?: RGBA;
}

export type LayoutGrid = RowsColsLayoutGrid | GridLayoutGrid;

export interface ExportSettingsConstraints {
  type: "SCALE" | "WIDTH" | "HEIGHT";
  value: number;
}

export interface ExportSettingsImage {
  format: "JPG" | "PNG";
  contentsOnly?: boolean; // defaults to true
  suffix?: string;
  constraint?: ExportSettingsConstraints;
}

export interface ExportSettingsSVG {
  format: "SVG";
  contentsOnly?: boolean; // defaults to true
  suffix?: string;
  svgOutlineText?: boolean; // defaults to true
  svgIdAttribute?: boolean; // defaults to false
  svgSimplifyStroke?: boolean; // defaults to true
}

export interface ExportSettingsPDF {
  format: "PDF";
  contentsOnly?: boolean; // defaults to true
  suffix?: string;
}

export type ExportSettings =
  | ExportSettingsImage
  | ExportSettingsSVG
  | ExportSettingsPDF;

export type WindingRule = "NONZERO" | "EVENODD";

export interface VectorVertex {
  readonly x: number;
  readonly y: number;
  readonly strokeCap?: StrokeCap;
  readonly strokeJoin?: StrokeJoin;
  readonly cornerRadius?: number;
  readonly handleMirroring?: HandleMirroring;
}

export interface VectorSegment {
  readonly start: number;
  readonly end: number;
  readonly tangentStart?: Vector; // Defaults to { x: 0, y: 0 }
  readonly tangentEnd?: Vector; // Defaults to { x: 0, y: 0 }
}

export interface VectorRegion {
  readonly windingRule: WindingRule;
  readonly loops: ReadonlyArray<ReadonlyArray<number>>;
}

export interface VectorNetwork {
  readonly vertices: ReadonlyArray<VectorVertex>;
  readonly segments: ReadonlyArray<VectorSegment>;
  readonly regions?: ReadonlyArray<VectorRegion>; // Defaults to []
}

export interface VectorPath {
  readonly windingRule: WindingRule | "NONE";
  readonly data: string;
}

export type VectorPaths = ReadonlyArray<VectorPath>;

export interface LetterSpacing {
  readonly value: number;
  readonly unit: "PIXELS" | "PERCENT";
}

export type LineHeight =
  | {
      readonly value: number;
      readonly unit: "PIXELS" | "PERCENT";
    }
  | {
      readonly unit: "AUTO";
    };

export type BlendMode =
  | "PASS_THROUGH"
  | "NORMAL"
  | "DARKEN"
  | "MULTIPLY"
  | "LINEAR_BURN"
  | "COLOR_BURN"
  | "LIGHTEN"
  | "SCREEN"
  | "LINEAR_DODGE"
  | "COLOR_DODGE"
  | "OVERLAY"
  | "SOFT_LIGHT"
  | "HARD_LIGHT"
  | "DIFFERENCE"
  | "EXCLUSION"
  | "HUE"
  | "SATURATION"
  | "COLOR"
  | "LUMINOSITY";

export interface Font {
  fontName: FontName;
}

////////////////////////////////////////////////////////////////////////////////
// Mixins

export interface BaseNodeMixin {
  // readonly id: string;
  readonly name: string;

  readonly pluginData?: { [key: string]: string };

  // Namespace is a string that must be at least 3 alphanumeric characters, and should
  // be a name related to your plugin. Other plugins will be able to read this data.
  readonly sharedPluginData?: {
    [namespace: string]: { [key: string]: string };
  };
}

export interface SceneNodeMixin {
  visible?: boolean;
  locked?: boolean;
}

export interface ChildrenMixin {
  readonly children?: ReadonlyArray<SceneNode>;
}

export interface ConstraintMixin {
  constraints?: Constraints;
}

export interface LayoutMixin {
  x: number;
  y: number;
  rotation?: number; // In degrees
  width: number;
  height: number;
  // Restrictions apply: https://www.figma.com/plugin-docs/api/properties/nodes-relativetransform/
  relativeTransform?: Transform;
}

export interface BlendMixin {
  opacity?: number;
  blendMode?: BlendMode;
  isMask?: boolean;
  effects?: ReadonlyArray<Effect>;
  effectStyleId?: string;
}

export interface FrameMixin {
  backgrounds?: ReadonlyArray<Paint>;
  layoutGrids?: ReadonlyArray<LayoutGrid>;
  clipsContent?: boolean;
  guides?: ReadonlyArray<Guide>;
  gridStyleId?: string;
  backgroundStyleId?: string;
}

export type StrokeCap =
  | "NONE"
  | "ROUND"
  | "SQUARE"
  | "ARROW_LINES"
  | "ARROW_EQUILATERAL";
export type StrokeJoin = "MITER" | "BEVEL" | "ROUND";
export type HandleMirroring = "NONE" | "ANGLE" | "ANGLE_AND_LENGTH";

export interface GeometryMixin {
  fills?: ReadonlyArray<Paint> | Mixed;
  strokes?: ReadonlyArray<Paint>;
  strokeWeight?: number;
  strokeAlign?: "CENTER" | "INSIDE" | "OUTSIDE";
  strokeCap?: StrokeCap | Mixed;
  strokeJoin?: StrokeJoin | Mixed;
  dashPattern?: ReadonlyArray<number>;
  fillStyleId?: string | Mixed;
  strokeStyleId?: string;
}

export interface CornerMixin {
  cornerRadius?: number | Mixed;
  cornerSmoothing?: number;
}

export interface ExportMixin {
  exportSettings?: ReadonlyArray<ExportSettings>;
}

export interface DefaultShapeMixin
  extends BaseNodeMixin,
    SceneNodeMixin,
    BlendMixin,
    GeometryMixin,
    LayoutMixin,
    ExportMixin {}

export interface DefaultContainerMixin
  extends BaseNodeMixin,
    SceneNodeMixin,
    ChildrenMixin,
    FrameMixin,
    BlendMixin,
    ConstraintMixin,
    LayoutMixin,
    ExportMixin {}

////////////////////////////////////////////////////////////////////////////////
// Nodes

export interface DocumentNode extends BaseNodeMixin {
  readonly type: "DOCUMENT";

  readonly children: ReadonlyArray<PageNode>;
}

export interface PageNode extends BaseNodeMixin, ChildrenMixin, ExportMixin {
  readonly type: "PAGE";

  guides?: ReadonlyArray<Guide>;
  selection?: ReadonlyArray<SceneNode>;

  backgrounds?: ReadonlyArray<Paint>;
}

export interface FrameNode extends DefaultContainerMixin {
  readonly type: "FRAME" | "GROUP";
}

export interface SliceNode
  extends BaseNodeMixin,
    SceneNodeMixin,
    LayoutMixin,
    ExportMixin {
  readonly type: "SLICE";
}

export interface RectangleNode
  extends DefaultShapeMixin,
    ConstraintMixin,
    CornerMixin {
  readonly type: "RECTANGLE";
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
}

export interface LineNode extends DefaultShapeMixin, ConstraintMixin {
  readonly type: "LINE";
}

export interface EllipseNode
  extends DefaultShapeMixin,
    ConstraintMixin,
    CornerMixin {
  readonly type: "ELLIPSE";
  // Only need to provide if it doesn't match the default
  arcData?: ArcData;
}

export interface PolygonNode
  extends DefaultShapeMixin,
    ConstraintMixin,
    CornerMixin {
  readonly type: "POLYGON";
  pointCount: number;
}

export interface StarNode
  extends DefaultShapeMixin,
    ConstraintMixin,
    CornerMixin {
  readonly type: "STAR";
  pointCount: number;
  innerRadius: number;
}

export interface VectorNode
  extends DefaultShapeMixin,
    ConstraintMixin,
    CornerMixin {
  readonly type: "VECTOR";
  vectorNetwork: VectorNetwork;
  vectorPaths: VectorPaths;
  handleMirroring: HandleMirroring | Mixed;
}

interface TextRange {
  start: number;
  // End of range is exclusive
  end: number;

  // At least one of these properties is required. But too lazy to indicate that in TS
  textStyleId?: string;
  fontSize?: number;
  fontName?: FontName;
  textCase?: TextCase;
  textDecoration?: TextDecoration;
  letterSpacing?: LetterSpacing;
  lineHeight?: LineHeight;
  fills?: ReadonlyArray<Paint>;
  fillStyleId?: string;
}

export interface TextNode extends DefaultShapeMixin, ConstraintMixin {
  readonly type: "TEXT";
  characters: string;
  // readonly hasMissingFont: boolean;
  textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical: "TOP" | "CENTER" | "BOTTOM";
  textAutoResize: "NONE" | "WIDTH_AND_HEIGHT" | "HEIGHT";
  paragraphIndent: number;
  paragraphSpacing: number;
  autoRename: boolean;

  // If the value of any of these properties is mixed,
  // the values are stored in ranges[] below
  textStyleId?: string | Mixed;
  fontSize: number | Mixed;
  fontName: FontName | Mixed;
  textCase: TextCase | Mixed;
  textDecoration: TextDecoration | Mixed;
  letterSpacing: LetterSpacing | Mixed;
  lineHeight: LineHeight | Mixed;

  // Equivalent in Figma API is getRangeFontSize/setRangeFontSize, etc.
  ranges?: TextRange[];
}

export interface ComponentNode extends DefaultContainerMixin {
  readonly type: "COMPONENT";

  description: string;
  readonly remote: boolean;
  readonly key: string; // The key to use with "importComponentByKeyAsync"
}

export interface InstanceNode extends DefaultContainerMixin {
  readonly type: "INSTANCE";
  //masterComponent: ComponentNode;
  // This represents a link to the master,
  // which may or may not be in this JSON document
  masterKey: string;
}

export interface BooleanOperationNode
  extends DefaultShapeMixin,
    ChildrenMixin,
    CornerMixin {
  readonly type: "BOOLEAN_OPERATION";
  booleanOperation: "UNION" | "INTERSECT" | "SUBTRACT" | "EXCLUDE";
}

export type BaseNode = DocumentNode | PageNode | SceneNode;

export type SceneNode =
  | SliceNode
  | FrameNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | VectorNode
  | StarNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | RectangleNode
  | TextNode;

export type NodeType =
  | "DOCUMENT"
  | "PAGE"
  | "SLICE"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "INSTANCE"
  | "BOOLEAN_OPERATION"
  | "VECTOR"
  | "STAR"
  | "LINE"
  | "ELLIPSE"
  | "POLYGON"
  | "RECTANGLE"
  | "TEXT";

////////////////////////////////////////////////////////////////////////////////
// Styles
export type StyleType = "PAINT" | "TEXT" | "EFFECT" | "GRID";

export interface BaseStyle {
  readonly id: string;
  readonly type: StyleType;
  name: string;
  description: string;
  // TODO: spec out what this means more clearly
  remote: boolean;
  readonly key: string; // The key to use with "importStyleByKeyAsync"
}

export interface PaintStyle extends BaseStyle {
  type: "PAINT";
  paints: ReadonlyArray<Paint>;
}

export interface TextStyle extends BaseStyle {
  type: "TEXT";
  fontSize: number;
  textDecoration: TextDecoration;
  fontName: FontName;
  letterSpacing: LetterSpacing;
  lineHeight: LineHeight;
  paragraphIndent: number;
  paragraphSpacing: number;
  textCase: TextCase;
}

export interface EffectStyle extends BaseStyle {
  type: "EFFECT";
  effects: ReadonlyArray<Effect>;
}

export interface GridStyle extends BaseStyle {
  type: "GRID";
  layoutGrids: ReadonlyArray<LayoutGrid>;
}
