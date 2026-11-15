/**
 * 整合包详情页抽取器：/modpack/{id}.html
 *
 * 这个页面与模组页 /class/{id}.html 的右栏结构完全同构
 * （`.class-text > .class-title / .class-text-top / .class-menu-page / .class-menu-main`），
 * 左栏也同样是封面 + 卡片 + 成员列表，所以直接复用 klass 的抽取逻辑，
 * 只把 kind 换成 modpack，方便调用方区分文案。
 */
(function () {
  'use strict';
  var MP = window.MP;

  MP.extract = MP.extract || {};
  MP.extract.modpackDetail = function (doc) {
    var d = MP.extract.klass(doc);
    if (!d || !d.ok) return d;
    d.kind = 'modpack';
    return d;
  };
})();
