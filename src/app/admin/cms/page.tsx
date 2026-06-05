import { getCmsState } from "./actions";
import { CmsEditor } from "./cms-editor";

export default async function AdminCmsPage() {
  const state = await getCmsState();
  return <CmsEditor initial={state.content} versions={state.versions} setupMode={state.setupMode} />;
}
