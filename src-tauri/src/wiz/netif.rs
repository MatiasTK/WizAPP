use std::net::Ipv4Addr;

/// `ip | !netmask`.
pub fn broadcast_for(ip: Ipv4Addr, mask: Ipv4Addr) -> Ipv4Addr {
    Ipv4Addr::from(u32::from(ip) | !u32::from(mask))
}

/// Directed-broadcast address of every non-loopback IPv4 interface, deduplicated.
/// Falls back to the limited broadcast when no interface qualifies.
pub fn broadcast_addresses() -> Vec<Ipv4Addr> {
    let mut out: Vec<Ipv4Addr> = Vec::new();
    for iface in if_addrs::get_if_addrs().unwrap_or_default() {
        if iface.is_loopback() {
            continue;
        }
        if let if_addrs::IfAddr::V4(v4) = iface.addr {
            let b = broadcast_for(v4.ip, v4.netmask);
            if !out.contains(&b) {
                out.push(b);
            }
        }
    }
    if out.is_empty() {
        out.push(Ipv4Addr::BROADCAST);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn computes_directed_broadcast() {
        let b = broadcast_for(Ipv4Addr::new(192, 168, 1, 40), Ipv4Addr::new(255, 255, 255, 0));
        assert_eq!(b, Ipv4Addr::new(192, 168, 1, 255));
        let b = broadcast_for(Ipv4Addr::new(10, 1, 2, 3), Ipv4Addr::new(255, 255, 0, 0));
        assert_eq!(b, Ipv4Addr::new(10, 1, 255, 255));
    }

    #[test]
    fn never_empty() {
        assert!(!broadcast_addresses().is_empty());
    }
}
