
const reals = String.raw`\mathbb{R}`;
const realplusplus = String.raw`\mathbb{R}_{++}`;
const realdplus = String.raw`\mathbb{R}_{+}^d`;
const reald = String.raw`\mathbb{R}^{d}`;
const KLDdphi = String.raw`\sum_{i=1}^{d} p_i*log_{2}(p_i/y_i)`;
const KLDphi = String.raw`\sum_{i=1}^{d} p_i*log_{2}(p_i)`;
const GIDphi = String.raw`\sum_{i=1}^{d} p_i*log(p_i/y_i)`;
const GIDdphi = String.raw`\sum_{i=1}^{d} p_i*log(p_i) - \sum_{i=1}^{d}(x_j - y_j)`;




function KL(a, b) {
    //a = np.asarray(a, dtype=np.float)
    //b = np.asarray(b, dtype=np.float)
    //print(a,b)

    //return np.sum(np.where(a != 0, a * np.log(a / b), 0))
    return 0;
  }
