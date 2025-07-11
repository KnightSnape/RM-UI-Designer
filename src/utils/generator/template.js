const N = "\n";
const fabricType2type = {
    "UiArc": "arc",
    "UiRound": "round",
    "UiRect": "rect",
    "UiLine": "line",
    "UiEllipse": "ellipse",
    "UiText": "string",
    "UiNumber": "number",
    "UiFloat": "number",
}
const fabricType2id = {
    "UiLine": 0,
    "UiRect": 1,
    "UiRound": 2,
    "UiEllipse": 3,
    "UiArc": 4,
    "UiFloat": 5,
    "UiNumber": 6,
    "UiText": 7,
}
const fabricKey2key = {
    'lineWidth': 'width',
    'layer': 'layer',
    'x': 'start_x',
    'y': 'start_y',
    'x2': 'end_x',
    'y2': 'end_y',
    'rx': 'rx',
    'ry': 'ry',
    'r': 'r',
    'startAngle': 'start_angle',
    'endAngle': 'end_angle',
    'number': 'number',
    'color': 'color',
    'fontSize': 'font_size',
    'strLength': 'str_length',
}
const color2id = {
    main: 0,
    yellow: 1,
    green: 2,
    orange: 3,
    purple: 4,
    pink: 5,
    cyan: 6,
    black: 7,
    white: 8,
}

function ui_h_group(frame_name, group_name, split_num) {
    let res = ''

    for (let i = 0; i < split_num; i++) {
        res = res + `\n#include "ui_${frame_name}_${group_name}_${i}.h"`
    }

    let res_init = `\n#define ui_init_${frame_name}_${group_name}() \\\n`
    let res_update = `\n#define ui_update_${frame_name}_${group_name}() \\\n`
    let res_remove = `\n#define ui_remove_${frame_name}_${group_name}() \\\n`
    for (let i = 0; i < split_num; i++) {
        res_init += `_ui_init_${frame_name}_${group_name}_${i}(); \\\n`
        res_update += `_ui_update_${frame_name}_${group_name}_${i}(); \\\n`
        res_remove += `_ui_remove_${frame_name}_${group_name}_${i}(); \\\n`
    }
    res += `${
        N}${res_init.slice(0, -4)}${
        N}${res_update.slice(0, -4)}${
        N}${res_remove.slice(0, -4)}
    `
    return `${res}\n`
}

function ui_h_frame(frame_name, groups) {
    let res = ''
    for (let group of groups) {
        res += ui_h_group(frame_name, group.group_name, group.splits.length)
    }
    return res
}

export function ui_h(frames) {
    let res = `//${
        N}// Created by RM UI Designer${
        N}//${
        N}${
        N}#ifndef UI_H${
        N}#define UI_H${
        N}#ifdef __cplusplus${
        N}extern "C" {${
        N}#endif${
        N}${
        N}#include "ui_interface.h"${
        N}`

    for (let frame of frames) {
        res += ui_h_frame(frame.name, frame.groups)
    }

    return `${res}${
        N}${
        N}#ifdef __cplusplus${
        N}}${
        N}#endif${
        N}${
        N}#endif //UI_H\n`
}

export function ui_h_split(frame_name, group_name, split_id, objs) {
    let res = `//${
        N}// Created by RM UI Designer${
        N}//${
        N}${
        N}#ifndef UI_${frame_name}_${group_name}_${split_id}_H${
        N}#define UI_${frame_name}_${group_name}_${split_id}_H${
        N}${
        N}#include "ui_interface.h"${
        N}${
        N}`

    for (let obj of objs) {
        res += `extern ui_interface_${fabricType2type[obj.type]}_t *ui_${frame_name}_${group_name}_${obj.name};\n`
    }

    res += `${
        N}void _ui_init_${frame_name}_${group_name}_${split_id}();${
        N}void _ui_update_${frame_name}_${group_name}_${split_id}();${
        N}void _ui_remove_${frame_name}_${group_name}_${split_id}();${
        N}${
        N}#endif //UI_${frame_name}_${group_name}_${split_id}_H${
        N}`
    return res
}

function ui_c_obj(frame_name, group_name, _obj) {
    let obj = {..._obj}
    const typeId = fabricType2id[obj.type]
    const name = obj.name
    if (obj.type === "UiFloat") {
        obj.number = Math.round(obj.float * 1000)
        delete obj.float
    }
    if (obj.type === "UiRect") {
        obj.x2 = obj.x + obj.width
        obj.y2 = obj.y + obj.height
        delete obj.width
        delete obj.height
    }
    if (obj.type === 'UiFloat' || obj.type === 'UiNumber') {
        obj.lineWidth = Math.round(obj.fontSize / 10)
    }
    obj.color = color2id[obj.color]
    delete obj.type
    delete obj.id
    delete obj.name
    delete obj.group

    const pointer = `ui_${frame_name}_${group_name}_${name}`

    let res = `    ${pointer}->figure_type = ${typeId};\n`
    for (let key in obj) {
        let value = obj[key]
        if (typeof value === "number") {
            value = Math.round(value)
        }
        res += `    ${pointer}->${fabricKey2key[key]} = ${value};\n`
    }
    return `${res}\n`
}

export function ui_c_split(frame_name, frame_id, group_name, group_id,
                           split_id, start_id, objs, frame_obj_sum) {
    const split_name = `${frame_name}_${group_name}_${split_id}`
    let res = `//${
        N}// Created by RM UI Designer${
        N}//${
        N}${
        N}#include "ui_${split_name}.h"${
        N}${
        N}#define FRAME_ID ${frame_id}${
        N}#define GROUP_ID ${group_id}${
        N}#define START_ID ${start_id}${
        N}#define OBJ_NUM ${objs.length}${
        N}#define FRAME_OBJ_NUM ${frame_obj_sum}${
        N}${
        N}CAT(ui_, CAT(FRAME_OBJ_NUM, _frame_t)) ui_${split_name};${
        N}`
    
    for (let i = 0; i < objs.length; i++) {
        const type = fabricType2type[objs[i].type]
        const name = objs[i].name
        res += `ui_interface_${type}_t *ui_${frame_name}_${group_name}_${name} = `
            + `(ui_interface_${type}_t *)&(ui_${split_name}.data[${i}]);\n`
    }
    
    res += `${
    N}void _ui_init_${split_name}() {${
    N}    for (int i = 0; i < OBJ_NUM; i++) {${
    N}        ui_${split_name}.data[i].figure_name[0] = FRAME_ID;${
    N}        ui_${split_name}.data[i].figure_name[1] = GROUP_ID;${
    N}        ui_${split_name}.data[i].figure_name[2] = i + START_ID;${
    N}        ui_${split_name}.data[i].operate_type = 1;${
    N}    }${
    N}    for (int i = OBJ_NUM; i < FRAME_OBJ_NUM; i++) {${
    N}        ui_${split_name}.data[i].operate_type = 0;${
    N}    }${
    N}${N}`

    for (let obj of objs) {
        res += ui_c_obj(frame_name, group_name, obj)
    }
    
    res += `${
    N}    CAT(ui_proc_, CAT(FRAME_OBJ_NUM, _frame))(&ui_${split_name});${
    N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
    N}}${
    N}${
    N}void _ui_update_${split_name}() {${
    N}    for (int i = 0; i < OBJ_NUM; i++) {${
    N}        ui_${split_name}.data[i].operate_type = 2;${
    N}    }${
    N}${
    N}    CAT(ui_proc_, CAT(FRAME_OBJ_NUM, _frame))(&ui_${split_name});${
    N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
    N}}${
    N}${
    N}void _ui_remove_${split_name}() {${
    N}    for (int i = 0; i < OBJ_NUM; i++) {${
    N}        ui_${split_name}.data[i].operate_type = 3;${
    N}    }${
    N}${
    N}    CAT(ui_proc_, CAT(FRAME_OBJ_NUM, _frame))(&ui_${split_name});${
    N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
    N}}${
    N}`

    return res
}

export function ui_c_string_split(frame_name, frame_id, group_name, group_id,
                                    split_id, start_id, objs) {
    const split_name = `${frame_name}_${group_name}_${split_id}`
    const obj = {...objs[0]}
    const name = obj.name
    const text = obj.text
    obj.color = color2id[obj.color]
    obj.strLength = text.length
    obj.lineWidth = Math.round(obj.fontSize / 10)
    delete obj.text
    delete obj.type
    delete obj.id
    delete obj.name
    delete obj.group

    let res =  `//${
        N}// Created by RM UI Designer${
        N}//${
        N}${
        N}#include "ui_${split_name}.h"${
        N}#include "string.h"${
        N}${
        N}#define FRAME_ID ${frame_id}${
        N}#define GROUP_ID ${group_id}${
        N}#define START_ID ${start_id}${
        N}${
        N}ui_string_frame_t ui_${split_name};${
        N}${
        N}ui_interface_string_t* ui_${frame_name}_${group_name}_${name} = &ui_${split_name}.option;${
        N}${
        N}void _ui_init_${split_name}() {${
        N}    ui_${split_name}.option.figure_name[0] = FRAME_ID;${
        N}    ui_${split_name}.option.figure_name[1] = GROUP_ID;${
        N}    ui_${split_name}.option.figure_name[2] = START_ID;${
        N}    ui_${split_name}.option.operate_type = 1;${
        N}`

    res += `    ui_${split_name}.option.figure_type = ${fabricType2id['UiText']};\n`
    for (let key in obj) {
        let value = obj[key]
        if (typeof value === "number") {
            value = Math.round(value)
        }
        res += `    ui_${split_name}.option.${fabricKey2key[key]} = ${value};\n`
    }

    res += `    strcpy(ui_${frame_name}_${group_name}_${name}->string, "${text}");${
        N}${
        N}    ui_proc_string_frame(&ui_${split_name});${
        N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
        N}}${
        N}${
        N}void _ui_update_${split_name}() {${
        N}    ui_${split_name}.option.operate_type = 2;${
        N}${
        N}    ui_proc_string_frame(&ui_${split_name});${
        N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
        N}}${
        N}${
        N}void _ui_remove_${split_name}() {${
        N}    ui_${split_name}.option.operate_type = 3;${
        N}${
        N}    ui_proc_string_frame(&ui_${split_name});${
        N}    SEND_MESSAGE((uint8_t *) &ui_${split_name}, sizeof(ui_${split_name}));${
        N}}`

    return res
}

const interfaceHUrl = require('@/assets/code_template/static/ui_interface.h')
const interfaceCUrl = require('@/assets/code_template/static/ui_interface.c')
const typesHUrl = require('@/assets/code_template/static/ui_types.h')

let interfaceH = await (await fetch(interfaceHUrl)).text()
let interfaceC = await (await fetch(interfaceCUrl)).text()
let typesH = await (await fetch(typesHUrl)).text()

export async function getUiBase() {
    return {
        ui_interface: {
            h: interfaceH,
            c: interfaceC
        },
        ui_types: {
            h: typesH
        }
    }
}
