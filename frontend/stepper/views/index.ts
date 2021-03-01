import StackBundle from './c/stack';
import {Bundle} from "../../linker";

export default function(bundle: Bundle) {
    bundle.include(StackBundle);
};
