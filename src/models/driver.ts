import { Effect, Reducer } from 'umi';
import {
  queryDirs,
  queryBreadcrumb,
  moveDocuments,
  copyDocuments,
  deleteDocuments,
  updateDocuments,
  queryDocuments,
} from '@/services/driver';

export interface DiverModelState {
  dirs: Object[];
  dirsPath: Object;
  breadcrumb: Object[];
  dir: string;
  documents: Object[];
}

export interface DiverModelType {
  state: DiverModelState;
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
    save: Reducer<DiverModelState>;
    // 启用 immer 之后
    // save: ImmerReducer<DiverModelState>;
  };
}

const DiverModel: DiverModelType = {
  state: {
    dirs: [],
    dirsPath: {}, //store all path as key => value
    breadcrumb: [], //store dirs between selected and root
    dir: '', //current selected dir
    documents: [],
  },
  effects: {
    *goto({ payload }, { call, put, select }) {
      const { driver } = yield select((state: DiverModelState) => state);
      const documents = yield call(queryDocuments, { params: payload });
      let selectedDir = driver.dirsPath[payload.dir];
      if (selectedDir == undefined) {
        const breadcrumb =
          payload.dir == ''
            ? []
            : yield call(queryBreadcrumb, { params: payload });
        yield put({
          type: 'save',
          payload: {
            breadcrumb,
            dir: payload.dir,
            documents: documents.map((v) => ({ ...v, key: v.id })),
          },
        });
        return;
      }
      const breadcrumb = [];
      while (selectedDir.parent != '') {
        breadcrumb.push(selectedDir);
        selectedDir = driver.dirsPath[selectedDir.parent];
      }
      breadcrumb.reverse();
      yield put({
        type: 'save',
        payload: {
          breadcrumb,
          dir: payload.dir,
          documents: documents.map((v) => ({ ...v, key: v.id })),
        },
      });
    },
    *move({ payload }, { put, call, select }) {
      const res = yield call(moveDocuments, { payload });
      const { driver } = yield select((state: DiverModelState) => state);
      const dirsPath = driver.dirsPath;
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
            ...driver.documents.filter(
              (v) => !payload.documents.includes(v.key),
            ),
          ],
        },
      });
      return res;
    },
    *copy({ payload }, { call, put, select }) {
      const res = yield call(copyDocuments, { payload });
      const { driver } = yield select((state: DiverModelState) => state);
      const dirsPath = driver.dirsPath;
      const target = dirsPath[payload.target];
      const copyDirs = Object.values(dirsPath)
        .filter((v) => payload.documents.includes(v.key))
        .map((v) => ({ ...v, key: v.key + '-copy' })); //Avoid identical key value errors in tree
      if (target && copyDirs.length > 0) {
        //Copy selected dirs to target dir
        target.children = [...target.children, ...copyDirs];
        target.isLeaf = false;
        yield put({
          type: 'save',
          payload: {
            dirsPath,
          },
        });
      }
      return res;
    },
    *delete({ payload }, { put, call, select }) {
      const res = yield call(deleteDocuments, { payload });
      const { driver } = yield select((state: DiverModelState) => state);
      const state = {};
      const deleteDirs = driver.documents.filter(
        (v) =>
          v.type == 'dir' &&
          payload.documents.includes(v.key) &&
          driver.dirsPath[v.parent],
      );
      if (deleteDirs.length > 0) {
        deleteDirs.forEach((v) => {
          const vParent = driver.dirsPath[v.parent];
          vParent.children = vParent.children.filter(
            (item) => item.key != v.key,
          );
        });
        state.dirs = Object.values(driver.dirsPath).filter((v) => !v.parent);
      }
      yield put({
        type: 'save',
        payload: {
          ...state,
          documents: [
            ...driver.documents.filter(
              (v) => !payload.documents.includes(v.key),
            ),
          ],
        },
      });
      return res;
    },
    *update({ payload }, { call, put, select }) {
      const res = yield call(updateDocuments, { payload });
      const { driver } = yield select((state: DiverModelState) => state);
      const state = {};
      if (res.id) {
        res.key = res.id;
        state.documents = driver.documents.map((v) =>
          v.key == (payload.id ? res.key : payload.key)
            ? { ...payload, ...res }
            : v,
        );
        if (res.type == 'dir') {
          //sync dirs data
          const dirsPath = driver.dirsPath;
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
      const { driver } = yield select((state: DiverModelState) => state);
      const documents = yield call(queryDocuments, payload);
      yield put({
        type: 'save',
        payload: {
          documents: driver.documents.concat(
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
      const { driver } = yield select((state: DiverModelState) => state);
      const parentDir = driver.dirsPath[payload.dir];
      if (parentDir && parentDir.hasLoad) {
        return [];
      }
      const res = payload.dir
        ? yield call(queryDirs, { params: payload })
        : [{ id: 'root', title: 'My Docs', type: 'dir', parent: '' }];
      const dirsPath = Object.assign(
        driver.dirsPath,
        ...res.map((v) => ({
          [v.id]: {
            ...v,
            key: v.id,
            isLeaf: v.type == 'file',
            children: [],
          },
        })),
      );
      while (Object.values(dirsPath).filter((v) => !v.checked).length > 0) {
        Object.values(dirsPath)
          .filter((v) => !v.checked)
          .forEach((v) => {
            if (v.parent && dirsPath[v.parent]) {
              dirsPath[v.parent].children.push(v);
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

export default DiverModel;
