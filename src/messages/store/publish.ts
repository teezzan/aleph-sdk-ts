import { base } from '../../accounts/index';
import { BaseContent, BaseMessage, MessageType, StorageEngine } from '../message';
import { PushFileToStorageEngine, PutContentToStorageEngine } from '../create/publish';
import { SignAndBroadcast } from '../create/signature';

type StorePublishConfiguration = {
    channel: string;
    account: base.Account;
    fileObject: File | Blob | string;
    storageEngine: StorageEngine;
    APIServer: string;
};

type StoreContent = BaseContent & {
    item_type: string;
    item_hash?: string;
    size?: number;
    content_type?: string;
    ref?: string;
};

export async function Publish(spc: StorePublishConfiguration): Promise<BaseMessage> {
    const hash = await PushFileToStorageEngine({
        APIServer: spc.APIServer,
        storageEngine: spc.storageEngine,
        file: spc.fileObject,
    });

    const timestamp = Date.now() / 1000;
    const content: StoreContent = {
        address: spc.account.address,
        item_type: spc.storageEngine,
        item_hash: hash,
        time: timestamp,
    };

    const message: BaseMessage = {
        signature: '',
        chain: spc.account.GetChain(),
        sender: spc.account.address,
        type: MessageType.Store,
        channel: spc.channel,
        confirmed: false,
        time: timestamp,
        size: 0,
        item_type: spc.storageEngine,
        item_content: '',
        item_hash: '',
    };

    await PutContentToStorageEngine({
        message: message,
        content: content,
        inlineRequested: true,
        storageEngine: spc.storageEngine,
        APIServer: spc.APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account: spc.account,
        APIServer: spc.APIServer,
    });

    return message;
}