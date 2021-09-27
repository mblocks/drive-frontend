import { Effect, Reducer } from 'umi';
import {
  queryDirs,
  queryBreadcrumb,
  moveDocuments,
  copyDocuments,
  deleteDocuments,
  updateDocuments,
  queryDocuments,
} from '@/services/drive';

export interface DriveModelState {
  dirs: Object[];
  dirsPath: Object;
  breadcrumb: Object[];
  dir: string;
  documents: Object[];
}

export interface DriveModelType {
  state: DriveModelState;
  effects: {
    goto: Effect;
    move: Effect;
    copy: Effect;
    delete: Effect;
    update: Effect;
    fetchDocuments: Effect;
    fetchDirs: Effect;
    fetchBreadcrumb: Effect;
  };
  reducers: {
    create: Reducer;
    cancel: Reducer;
    save: Reducer<DriveModelState>;
    // 启用 immer 之后
    // save: ImmerReducer<DriveModelState>;
  };
}

const DriveModel: DriveModelType = {
  state: {
    dirs: [],
    dirsPath: {}, //store all path as key => value
    breadcrumb: [], //store dirs between selected and root
    dir: '', //current selected dir
    documents: [],
  },
  effects: {
    *goto({ payload }, { call, put, select }) {
      const { drive } = yield select((state: DriveModelState) => state);
      const documents = yield call(queryDocuments, { params: payload });
      let selectedDir = drive.dirsPath[payload.parent];
      if (selectedDir == undefined) {
        const breadcrumb =
          payload.parent == ''
            ? []
            : yield call(queryBreadcrumb, { params: payload });
        yield put({
          type: 'save',
          payload: {
            breadcrumb,
            parent: payload.parent,
            documents: documents.map((v) => ({ ...v, key: v.id })),
          },
        });
        return;
      }
      const breadcrumb = [];
      while (selectedDir.parent != '') {
        breadcrumb.push(selectedDir);
        selectedDir = drive.dirsPath[selectedDir.parent];
      }
      breadcrumb.reverse();
      yield put({
        type: 'save',
        payload: {
          breadcrumb,
          parent: payload.parent,
          documents: documents.map((v) => ({ ...v, key: v.id })),
        },
      });
    },
    *move({ payload }, { put, call, select }) {
      const res = yield call(moveDocuments, { payload });
      const { drive } = yield select((state: DriveModelState) => state);
      const dirsPath = drive.dirsPath;
      const target = dirsPath[payload.target];
      const moveDirs = Object.values(dirsPath).filter((v) =>
        payload.documents.includes(v.key),
      ); //Avoid identical key value errors in tree
      const state = {};
      if (target && moveDirs.length > 0) {
        //Move selected dirs to target dir
        target.children = [...target.children, ...moveDirs];
        target.isLeaf = false;
        //selected dirs's parent children remove itself
        moveDirs.forEach((v) => {
          const vParent = dirsPath[v.parent];
          if (vParent) {
            vParent.children = [
              ...vParent.children.filter((item) => item.key != v.key),
            ];
          }
        });
        state.dirsPath = dirsPath;
        state.dirs = [...Object.values(dirsPath).filter((v) => !v.parent)];
      }
      yield put({
        type: 'save',
        payload: {
          ...state,
          documents: [
            ...drive.documents.filter(
              (v) => !payload.documents.includes(v.key),
            ),
          ],
        },
      });
      return res;
    },
    *copy({ payload }, { call, put, select }) {
      const targetChildren = yield call(copyDocuments, { payload });
      const { drive } = yield select((state: DriveModelState) => state);
      const dirsPath = Object.assign(
        drive.dirsPath,
        ...targetChildren.map((v) => ({
          [v.id]: {
            ...v,
            key: v.id,
            isLeaf: v.type == 'file',
            children: [],
            title: v.name,
          },
        })),
      );
      const target = dirsPath[payload.target];
      const refreshChildren = targetChildren.map((v) => ({
        ...v,
        key: v.id,
        isLeaf: v.type == 'file',
        children: [],
        parent: payload.target,
        title: v.name,
      })); //Avoid identical key value errors in tree
      if (target) {
        //Copy selected dirs to target dir
        target.children = refreshChildren;
        target.isLeaf = false;
        yield put({
          type: 'save',
          payload: {
            dirsPath,
            dirs: Object.values(dirsPath).filter((v) => !v.parent),
          },
        });
      }
      return targetChildren;
    },
    *delete({ payload }, { put, call, select }) {
      const res = yield call(deleteDocuments, { payload: payload.documents });
      const { drive } = yield select((state: DriveModelState) => state);
      const state = {};
      const deleteDirs = drive.documents.filter(
        (v) =>
          v.type == 'dir' &&
          payload.documents.includes(v.key) &&
          drive.dirsPath[v.parent],
      );
      if (deleteDirs.length > 0) {
        deleteDirs.forEach((v) => {
          const vParent = drive.dirsPath[v.parent];
          vParent.children = vParent.children.filter(
            (item) => item.key != v.key,
          );
        });
        state.dirs = Object.values(drive.dirsPath).filter(
          (v) => !v.parent && !payload.documents.includes(v.key),
        );
      }
      yield put({
        type: 'save',
        payload: {
          ...state,
          documents: [
            ...drive.documents.filter(
              (v) => !payload.documents.includes(v.key),
            ),
          ],
        },
      });
      return res;
    },
    *update({ payload }, { call, put, select }) {
      const res = yield call(updateDocuments, { payload });
      const { drive } = yield select((state: DriveModelState) => state);
      const state = {};
      if (res.id) {
        res.key = res.id;
        state.documents = drive.documents.map((v) =>
          v.key == (payload.id ? res.key : payload.key)
            ? { ...payload, ...res }
            : v,
        );
        if (res.type == 'dir') {
          //sync dirs data
          const dirsPath = drive.dirsPath;
          if (dirsPath[res.parent]) {
            if (
              dirsPath[res.parent].children.filter((v) => v.key == res.key)
                .length == 0
            ) {
              dirsPath[res.key] = {
                ...res,
                title: res.name,
                isLeaf: true,
                children: [],
              };
              dirsPath[res.key].checked = true;
              dirsPath[res.parent].isLeaf = false;
              dirsPath[res.parent].children.push(dirsPath[res.key]);
            } else {
              dirsPath[res.parent].children = dirsPath[res.parent].children.map(
                (v) =>
                  v.key == res.key ? { ...v, ...res, title: res.name } : v,
              );
            }
            state.dirsPath = dirsPath;
            state.dirs = [...Object.values(dirsPath).filter((v) => !v.parent)];
          }
        }
        yield put({
          type: 'save',
          payload: state,
        });
      }
      return res;
    },
    *fetchDocuments({ payload }, { call, put, select }) {
      const { drive } = yield select((state: DriveModelState) => state);
      const documents = yield call(queryDocuments, payload);
      yield put({
        type: 'save',
        payload: {
          documents: drive.documents.concat(
            documents.map((v) => ({ ...v, key: v.id })),
          ),
        },
      });
      return documents;
    },
    *fetchBreadcrumb({ payload }, { call, put }) {
      const breadcrumb = yield call(queryBreadcrumb, { params: payload });
      yield put({ type: 'save', payload: { breadcrumb } });
      return breadcrumb;
    },
    *fetchDirs({ payload }, { call, put, select }) {
      const { drive } = yield select((state: DriveModelState) => state);
      const parentDir = drive.dirsPath[payload.parent];
      if (parentDir && parentDir.hasLoad) {
        return [];
      }
      const res = payload.parent
        ? yield call(queryDirs, { params: payload })
        : [{ id: 'root', name: 'My Docs', type: 'dir', parent: '' }];
      const dirsPath = Object.assign(
        drive.dirsPath,
        ...res.map((v) => ({
          [v.id]: {
            ...v,
            key: v.id,
            isLeaf: v.type == 'file',
            children: [],
            title: v.name,
          },
        })),
      );
      while (Object.values(dirsPath).filter((v) => !v.checked).length > 0) {
        Object.values(dirsPath)
          .filter((v) => !v.checked)
          .forEach((v) => {
            if (v.parent && dirsPath[v.parent]) {
              dirsPath[v.parent].children.push(v);
              dirsPath[v.parent].children = [
                ...new Map(
                  dirsPath[v.parent].children.map((item) => [
                    item['key'],
                    item,
                  ]),
                ).values(),
              ];
              dirsPath[v.parent].hasLoad = true;
            }
            dirsPath[v.key].checked = true;
          });
      }
      yield put({
        type: 'save',
        payload: {
          dirsPath,
          dirs: Object.values(dirsPath).filter((v) => !v.parent),
        },
      });
      return res;
    },
  },
  reducers: {
    create(state, { payload }) {
      if (state.documents.filter((v) => !v.id).length > 0) {
        //Only one can be created at a time
        return state;
      }
      payload.key = new Date().getTime();
      return { ...state, documents: [payload, ...state.documents] };
    },
    cancel(state, { payload }) {
      return {
        ...state,
        documents: [...state.documents.filter((v) => v.key != payload.key)],
      };
    },
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};

export default DriveModel;
